require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./config/db'); 

app.use(express.json());

// Ensure revoked_tokens table exists (used for logout token revocation)
(async () => {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS revoked_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL
    )`);
    console.log('Ensured revoked_tokens table exists');
  } catch (err) {
    console.error('Failed to ensure revoked_tokens table:', err);
  }
})();

// Auth routes
app.use('/auth', require('./routes/auth.routes'));

// Film routes
app.use('/films', require('./routes/film.routes'));

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.send(`Database Connected! Solution: ${rows[0].solution}`);
  } catch (err) {
    res.status(500).send("Database connection failed.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
