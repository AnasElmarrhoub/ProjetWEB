const db = require('../config/db');

exports.filmColumns = async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cinema_db';
    const [cols] = await db.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'FILM'", [dbName]);
    res.json({ table: 'FILM', columns: cols });
  } catch (err) {
    console.error('debug.filmColumns error:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
};
