// server/middleware/requireAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findById(payload.id || payload._id).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (String(user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
