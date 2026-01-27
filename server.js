
import express from 'express';
import pg from 'pg';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Move API routes BEFORE static file serving
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Normalize sort_order on startup - ensures sequential values for waiting patients
async function normalizeSortOrder() {
    try {
        // Ensure FAMILY/RELATIVE types have sort_order = 0
        await pool.query(`UPDATE patients SET sort_order = 0 WHERE type IN ('FAMILY', 'RELATIVE')`);
        
        // Renumber non-pinned waiting patients for today with sequential sort_order
        await pool.query(`
            WITH ranked AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_order
                FROM patients 
                WHERE DATE(created_at) = CURRENT_DATE 
                AND status = 'WAITING' 
                AND type NOT IN ('FAMILY', 'RELATIVE')
                AND (sort_order IS NULL OR sort_order = 0)
            )
            UPDATE patients 
            SET sort_order = ranked.new_order 
            FROM ranked 
            WHERE patients.id = ranked.id
        `);
        console.log('Sort order normalization completed');
    } catch (err) {
        console.error('Sort order normalization error:', err.message);
    }
}

// Run normalization on startup
normalizeSortOrder();

// Aggressive Cache-Control for Development
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// Get all patients with their messages (filtered by today's date)
app.get('/api/patients', async (req, res) => {
    try {
        // Filter patients where created_at is today
        const patientsRes = await pool.query(
            `SELECT * FROM patients WHERE DATE(created_at) = CURRENT_DATE ORDER BY created_at ASC`
        );
        const messagesRes = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC');
        
        const patients = patientsRes.rows;
        const messages = messagesRes.rows;

        const data = patients.map(p => ({
            ...p,
            queueId: p.queue_id,
            createdAt: p.created_at,
            inTime: p.in_time,
            outTime: p.out_time,
            hasUnreadAlert: !!p.has_unread_alert,
            sortOrder: p.sort_order || 0,
            messages: messages.filter(m => m.patient_id === p.id).map(m => ({
                ...m,
                patientId: m.patient_id
            }))
        }));
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files with headers to prevent caching
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
}));

// Helper to safely convert timestamp to ISO string
const toISOSafe = (ts, fallbackToNow = false) => {
    if (!ts) return fallbackToNow ? new Date().toISOString() : null;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return fallbackToNow ? new Date().toISOString() : null;
    return date.toISOString();
};

// Get next queue ID for today (only counts PATIENT category, not VISITOR)
app.get('/api/next-queue-id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COALESCE(MAX(queue_id), 0) + 1 as next_id 
             FROM patients 
             WHERE DATE(created_at) = CURRENT_DATE AND category = 'PATIENT'`
        );
        res.json({ nextQueueId: result.rows[0].next_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Patient Report: Search with filters and date range (returns last 150 records by default)
app.get('/api/patients/report', async (req, res) => {
    try {
        const { name, city, mobile, startDate, endDate } = req.query;
        
        let query = 'SELECT * FROM patients WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (name) {
            query += ` AND LOWER(name) LIKE LOWER($${paramIndex})`;
            params.push(`%${name}%`);
            paramIndex++;
        }
        
        if (city) {
            query += ` AND LOWER(city) LIKE LOWER($${paramIndex})`;
            params.push(`%${city}%`);
            paramIndex++;
        }
        
        if (mobile) {
            query += ` AND mobile LIKE $${paramIndex}`;
            params.push(`%${mobile}%`);
            paramIndex++;
        }
        
        if (startDate) {
            query += ` AND DATE(created_at) >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        
        if (endDate) {
            query += ` AND DATE(created_at) <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }
        
        query += ' ORDER BY created_at DESC LIMIT 150';
        
        const result = await pool.query(query, params);
        
        const data = result.rows.map(p => ({
            ...p,
            queueId: p.queue_id,
            createdAt: p.created_at,
            inTime: p.in_time,
            outTime: p.out_time,
            hasUnreadAlert: !!p.has_unread_alert
        }));
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new patient (with atomic queue ID assignment using transaction)
app.post('/api/patients', async (req, res) => {
    const client = await pool.connect();
    try {
        const p = req.body;
        console.log('Adding patient:', p.id);
        const createdAt = toISOSafe(p.createdAt, true);
        const inTime = toISOSafe(p.inTime, true);
        
        await client.query('BEGIN');
        
        // For PATIENT category, calculate queue_id atomically within transaction
        let queueId = 0;
        if (p.category === 'PATIENT') {
            // Lock today's patient rows to prevent race conditions, then calculate max
            const lockResult = await client.query(
                `SELECT queue_id FROM patients 
                 WHERE DATE(created_at) = CURRENT_DATE AND category = 'PATIENT'
                 FOR UPDATE`
            );
            const maxQueueId = lockResult.rows.length > 0 
                ? Math.max(...lockResult.rows.map(r => r.queue_id)) 
                : 0;
            queueId = maxQueueId + 1;
        }
        
        // For FAMILY/RELATIVE types, sort_order = 0 (pinned at top)
        // For other types, sort_order = max + 1 (new at bottom of queue)
        const isPinned = p.type === 'FAMILY' || p.type === 'RELATIVE';
        let sortOrder = 0;
        
        if (!isPinned) {
            // Get max sort_order for non-pinned waiting patients today
            const maxResult = await client.query(
                `SELECT COALESCE(MAX(sort_order), 0) as max_order FROM patients 
                 WHERE DATE(created_at) = CURRENT_DATE 
                 AND status = 'WAITING' 
                 AND type NOT IN ('FAMILY', 'RELATIVE')`
            );
            sortOrder = (maxResult.rows[0].max_order || 0) + 1;
        }
        
        const result = await client.query(
            'INSERT INTO patients (id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, has_unread_alert, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING queue_id',
            [p.id, queueId, p.name, p.age, p.gender, p.category, p.type, p.city, p.mobile, p.status, createdAt, inTime, p.hasUnreadAlert, sortOrder]
        );
        
        await client.query('COMMIT');
        console.log('Insert result:', result.rowCount, 'Queue ID:', result.rows[0].queue_id);
        
        io.emit('patient:add', { patientId: p.id, queueId: result.rows[0].queue_id });
        
        res.status(201).json({ success: true, queueId: result.rows[0].queue_id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Insert error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Update patient status/data
app.patch('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Map camelCase to snake_case for PG and convert timestamps safely
        const pgUpdates = {};
        if ('queueId' in updates) pgUpdates.queue_id = updates.queueId;
        if ('createdAt' in updates) pgUpdates.created_at = toISOSafe(updates.createdAt);
        if ('inTime' in updates) pgUpdates.in_time = toISOSafe(updates.inTime);
        if ('outTime' in updates) pgUpdates.out_time = toISOSafe(updates.outTime);
        if ('hasUnreadAlert' in updates) pgUpdates.has_unread_alert = updates.hasUnreadAlert;
        
        Object.keys(updates).forEach(key => {
            if (!['queueId', 'createdAt', 'inTime', 'outTime', 'hasUnreadAlert'].includes(key)) {
                pgUpdates[key] = updates[key];
            }
        });

        const keys = Object.keys(pgUpdates);
        const values = Object.values(pgUpdates);
        
        if (keys.length === 0) return res.status(400).json({ error: 'No updates provided' });

        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        await pool.query(`UPDATE patients SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, id]);
        
        io.emit('patient:update', { patientId: id, updates });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change patient status (handles sort_order logic)
app.post('/api/patients/:id/status', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status, outTime } = req.body;
        
        await client.query('BEGIN');
        
        // Get current patient
        const patientRes = await client.query(
            'SELECT status, sort_order, type FROM patients WHERE id = $1', [id]
        );
        if (patientRes.rows.length === 0) {
            throw new Error('Patient not found');
        }
        
        const patient = patientRes.rows[0];
        const oldStatus = patient.status;
        const isPinned = patient.type === 'FAMILY' || patient.type === 'RELATIVE';
        
        // If moving FROM WAITING to OPD/COMPLETED, renumber remaining waiting cards
        if (oldStatus === 'WAITING' && status !== 'WAITING' && !isPinned && patient.sort_order > 0) {
            await client.query(
                `UPDATE patients SET sort_order = sort_order - 1 
                 WHERE DATE(created_at) = CURRENT_DATE 
                 AND status = 'WAITING' 
                 AND type NOT IN ('FAMILY', 'RELATIVE')
                 AND sort_order > $1`,
                [patient.sort_order]
            );
        }
        
        // If moving TO WAITING (from OPD), assign sort_order = 1 and shift others
        let newSortOrder = 0;
        if (status === 'WAITING' && oldStatus !== 'WAITING' && !isPinned) {
            await client.query(
                `UPDATE patients SET sort_order = sort_order + 1 
                 WHERE DATE(created_at) = CURRENT_DATE 
                 AND status = 'WAITING' 
                 AND type NOT IN ('FAMILY', 'RELATIVE')
                 AND sort_order > 0`
            );
            newSortOrder = 1;
        }
        
        // Update patient status
        const updateFields = { status };
        if (outTime) updateFields.out_time = toISOSafe(outTime);
        if (status === 'WAITING' && !isPinned) updateFields.sort_order = newSortOrder;
        if (status !== 'WAITING') updateFields.sort_order = 0;
        
        const keys = Object.keys(updateFields);
        const values = Object.values(updateFields);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        
        await client.query(`UPDATE patients SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, id]);
        
        await client.query('COMMIT');
        
        io.emit('patient:update', { patientId: id, updates: { status } });
        
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Reorder patient in waiting queue (move up or down)
app.post('/api/patients/:id/reorder', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'up' or 'down'
        
        await client.query('BEGIN');
        
        // Get current patient
        const patientRes = await client.query(
            'SELECT sort_order, type FROM patients WHERE id = $1', [id]
        );
        if (patientRes.rows.length === 0) {
            throw new Error('Patient not found');
        }
        
        const patient = patientRes.rows[0];
        const currentOrder = patient.sort_order;
        
        // Cannot reorder pinned types
        if (patient.type === 'FAMILY' || patient.type === 'RELATIVE') {
            return res.json({ success: false, message: 'Cannot reorder FAMILY/RELATIVE patients' });
        }
        
        // Find adjacent patient to swap with
        const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
        
        if (targetOrder < 1) {
            return res.json({ success: false, message: 'Already at top' });
        }
        
        // Find patient with target order (non-pinned, waiting, today)
        const adjacentRes = await client.query(
            `SELECT id FROM patients 
             WHERE DATE(created_at) = CURRENT_DATE 
             AND status = 'WAITING' 
             AND type NOT IN ('FAMILY', 'RELATIVE')
             AND sort_order = $1`,
            [targetOrder]
        );
        
        if (adjacentRes.rows.length === 0) {
            return res.json({ success: false, message: 'No patient to swap with' });
        }
        
        const adjacentId = adjacentRes.rows[0].id;
        
        // Swap sort orders
        await client.query('UPDATE patients SET sort_order = $1 WHERE id = $2', [targetOrder, id]);
        await client.query('UPDATE patients SET sort_order = $1 WHERE id = $2', [currentOrder, adjacentId]);
        
        await client.query('COMMIT');
        
        io.emit('patient:reorder', { patientId: id, direction });
        
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Drag-and-drop reorder endpoint
app.post('/api/patients/:id/move-to', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { targetId } = req.body;
        
        await client.query('BEGIN');
        
        // Get source patient
        const sourceRes = await client.query(
            'SELECT sort_order, type, status FROM patients WHERE id = $1', [id]
        );
        if (sourceRes.rows.length === 0) {
            throw new Error('Source patient not found');
        }
        const source = sourceRes.rows[0];
        
        // Cannot reorder pinned types or non-waiting
        if (source.type === 'FAMILY' || source.type === 'RELATIVE') {
            return res.json({ success: false, message: 'Cannot reorder FAMILY/RELATIVE patients' });
        }
        if (source.status !== 'WAITING') {
            return res.json({ success: false, message: 'Can only reorder waiting patients' });
        }
        
        // Get target patient
        const targetRes = await client.query(
            'SELECT sort_order, type FROM patients WHERE id = $1', [targetId]
        );
        if (targetRes.rows.length === 0) {
            throw new Error('Target patient not found');
        }
        const target = targetRes.rows[0];
        
        // Cannot drop on pinned types
        if (target.type === 'FAMILY' || target.type === 'RELATIVE') {
            return res.json({ success: false, message: 'Cannot drop on FAMILY/RELATIVE patients' });
        }
        
        const sourceOrder = source.sort_order;
        const targetOrder = target.sort_order;
        
        if (sourceOrder === targetOrder) {
            return res.json({ success: true }); // No change needed
        }
        
        if (sourceOrder < targetOrder) {
            // Moving down: shift items between source+1 and target up by 1
            await client.query(
                `UPDATE patients SET sort_order = sort_order - 1 
                 WHERE DATE(created_at) = CURRENT_DATE 
                 AND status = 'WAITING' 
                 AND type NOT IN ('FAMILY', 'RELATIVE')
                 AND sort_order > $1 AND sort_order <= $2`,
                [sourceOrder, targetOrder]
            );
        } else {
            // Moving up: shift items between target and source-1 down by 1
            await client.query(
                `UPDATE patients SET sort_order = sort_order + 1 
                 WHERE DATE(created_at) = CURRENT_DATE 
                 AND status = 'WAITING' 
                 AND type NOT IN ('FAMILY', 'RELATIVE')
                 AND sort_order >= $1 AND sort_order < $2`,
                [targetOrder, sourceOrder]
            );
        }
        
        // Set source to target position
        await client.query('UPDATE patients SET sort_order = $1 WHERE id = $2', [targetOrder, id]);
        
        await client.query('COMMIT');
        
        io.emit('patient:reorder', { patientId: id });
        
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
        
        io.emit('patient:delete', { patientId: req.params.id });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add message to chat
app.post('/api/patients/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const m = req.body;
        await pool.query(
            'INSERT INTO messages (id, patient_id, text, sender, timestamp) VALUES ($1, $2, $3, $4, $5)',
            [m.id, id, m.text, m.sender, m.timestamp]
        );
        await pool.query('UPDATE patients SET has_unread_alert = TRUE WHERE id = $1', [id]);
        
        io.emit('message:new', { patientId: id, message: m });
        
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Doctor calls operator - broadcasts to all connected clients
app.post('/api/call-operator', (req, res) => {
    console.log('Doctor calling operator...');
    io.emit('doctor:call-operator', { timestamp: Date.now() });
    res.json({ success: true });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with Socket.IO`);
});
