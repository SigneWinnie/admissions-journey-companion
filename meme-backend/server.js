const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Step 1: Connect WITHOUT a database first
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
});

db.connect(err => {
  if (err) { console.error('❌ DB connection failed:', err); return; }
  console.log('✅ MySQL connected');

  const dbName = process.env.DB_NAME || 'meme_generator';

  // Step 2: Create database if it doesn't exist
  db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
    if (err) { console.error('❌ Failed to create database:', err); return; }
    console.log(`✅ Database "${dbName}" ready`);

    // Step 3: Switch to that database
    db.query(`USE \`${dbName}\``, (err) => {
      if (err) { console.error('❌ Failed to select database:', err); return; }

      // Step 4: Create table if it doesn't exist
      db.query(`
        CREATE TABLE IF NOT EXISTS memes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255),
          image_data LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) { console.error('❌ Failed to create table:', err); return; }
        console.log('✅ Table "memes" ready');
        console.log('🚀 Backend running on http://localhost:3001');
      });
    });
  });
});

// GET all memes
app.get('/api/memes', (req, res) => {
  db.query('SELECT * FROM memes ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST save a meme
app.post('/api/memes', (req, res) => {
  const { title, image_data } = req.body;
  db.query(
    'INSERT INTO memes (title, image_data) VALUES (?, ?)',
    [title, image_data],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, title, image_data });
    }
  );
});

// DELETE a meme
app.delete('/api/memes/:id', (req, res) => {
  db.query('DELETE FROM memes WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(3001, () => {});