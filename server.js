
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Configuration
// UPDATE THESE VALUES FOR YOUR LOCAL ENVIRONMENT
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password', 
    database: 'clinic_flow'
};

let pool;

async function initDb() {
    try {
        pool = await mysql.createPool(dbConfig);
        console.log('Connected to MySQL Database');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

// Get all patients with their messages
app.get('/api/patients', async (req, res) => {
    try {
        const [patients] = await pool.query('SELECT * FROM patients');
        const [messages] = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC');
        
        // Map messages to their respective patients
        const data = patients.map(p => ({
            ...p,
            hasUnreadAlert: !!p.hasUnreadAlert, // Convert 1/0 to boolean
            messages: messages.filter(m => m.patientId === p.id)
        }));
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new patient
app.post('/api/patients', async (req, res) => {
    try {
        const p = req.body;
        await pool.query(
            'INSERT INTO patients (id, queueId, name, age, gender, category, type, city, mobile, status, createdAt, inTime, hasUnreadAlert) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        
        if (keys.length === 0) return res.status(400).json({ error: 'No updates provided' });

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        await pool.query(`UPDATE patients SET ${setClause} WHERE id = ?`, [...values, id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
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
            'INSERT INTO messages (id, patientId, text, sender, timestamp) VALUES (?, ?, ?, ?, ?)',
            [m.id, id, m.text, m.sender, m.timestamp]
        );
        // Also update the unread alert status on the patient
        await pool.query('UPDATE patients SET hasUnreadAlert = TRUE WHERE id = ?', [id]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    initDb();
    console.log(`Server running on http://localhost:${PORT}`);
});
