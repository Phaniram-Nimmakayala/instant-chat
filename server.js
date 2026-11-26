const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// Connect to SQLite database (creates chat.db if it doesn't exist)
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create messages table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// API Route: Save a new message
app.post('/api/messages', (req, res) => {
    const { chat } = req.body;

    if (!chat || chat.trim() === '') {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const sql = 'INSERT INTO messages (text) VALUES (?)';
    db.run(sql, [chat.trim()], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            id: this.lastID,
            text: chat.trim(),
            message: 'Saved successfully'
        });
    });
});

// API Route: Fetch all messages for the admin page
app.get('/api/messages', (req, res) => {
    const sql = 'SELECT * FROM messages ORDER BY id DESC';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API Route: Delete all messages
app.delete('/api/messages', (req, res) => {
    const sql = 'DELETE FROM messages';
    db.run(sql, [], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'All messages deleted', deletedCount: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Public Page: http://localhost:${PORT}/`);
    console.log(`Admin Page:  http://localhost:${PORT}/admin.html`);
});