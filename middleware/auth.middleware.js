const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    // check blacklist
    const [rows] = await db.query('SELECT 1 FROM revoked_tokens WHERE token = ? AND expires_at > NOW()', [token]);
    if (rows.length) return res.status(401).json({ message: 'Token revoked' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
