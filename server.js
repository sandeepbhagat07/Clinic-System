
import express from 'express';
import pg from 'pg';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Move API routes BEFORE static file serving
// Get all patients with their messages
app.get('/api/patients', async (req, res) => {
    try {
        const patientsRes = await pool.query('SELECT * FROM patients');
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

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'dist')));

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add new patient
app.post('/api/patients', async (req, res) => {
    try {
        const p = req.body;
        await pool.query(
            'INSERT INTO patients (id, queue_id, name, age, gender, category, type, city, mobile, status, created_at, in_time, has_unread_alert) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            [p.id, p.queueId, p.name, p.age, p.gender, p.category, p.type, p.city, p.mobile, p.status, p.createdAt, p.inTime, p.hasUnreadAlert]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update patient status/data
app.patch('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Map camelCase to snake_case for PG
        const pgUpdates = {};
        if ('queueId' in updates) pgUpdates.queue_id = updates.queueId;
        if ('createdAt' in updates) pgUpdates.created_at = updates.createdAt;
        if ('inTime' in updates) pgUpdates.in_time = updates.inTime;
        if ('outTime' in updates) pgUpdates.out_time = updates.outTime;
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
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
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
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
