// server/routes/authRoutes.js — Signup như Quizlet, cho phép username tiếng Việt & khoảng trắng
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ✅ Username: cho phép chữ Unicode + dấu (L/M), số (N), dấu chấm, gạch dưới, khoảng trắng; 3–20 ký tự
const USERNAME_REGEX = /^[\p{L}\p{M}\p{N}._ ]{3,20}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isAllDigits = (s) => /^\d+$/.test((s || '').replace(/\s+/g, '')); // bỏ khoảng trắng rồi kiểm tra
const looksLikeEmail = (s) => /@/.test(s || '');

// 🔎 Username availability (case-insensitive, locale 'vi')
router.get('/check-username', async (req, res) => {
  try {
    const raw = (req.query.username || '').trim();
    if (!raw) return res.json({ available: false, reason: 'empty' });
    const found = await User.findOne({ username: raw }).collation({ locale: 'vi', strength: 2 });
    res.json({ available: !found });
  } catch (e) {
    res.status(500).json({ available: false, error: 'server_error' });
  }
});

// 🔎 Email availability
router.get('/check-email', async (req, res) => {
  try {
    const raw = (req.query.email || '').trim();
    if (!raw || !EMAIL_REGEX.test(raw)) return res.json({ available: false, reason: 'invalid' });
    const found = await User.findOne({ email: raw }).collation({ locale: 'vi', strength: 2 });
    res.json({ available: !found });
  } catch (e) {
    res.status(500).json({ available: false, error: 'server_error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    let { username, email, password, role } = req.body;
    username = (username || '').trim();
    email = (email || '').trim();

    if (!username || !email || !password)
      return res.status(400).json({ message: 'Username, email and password are required' });

    if (!USERNAME_REGEX.test(username))
      return res.status(400).json({
        message: 'Username must be 3–20 characters and can include Vietnamese letters, spaces, dot, and underscore',
      });

    if (isAllDigits(username))
      return res.status(400).json({ message: 'Username cannot be numbers only' });

    if (looksLikeEmail(username))
      return res.status(400).json({ message: 'Username cannot be an email address' });

    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: 'Invalid email address' });

    const hasLen = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!(hasLen && hasLetter && hasNumber))
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include a letter and a number',
      });

    // Uniqueness (case-insensitive, tiếng Việt)
    const usernameTaken = await User.findOne({ username }).collation({ locale: 'vi', strength: 2 });
    if (usernameTaken) return res.status(409).json({ message: 'Username already taken' });

    const emailTaken = await User.findOne({ email }).collation({ locale: 'vi', strength: 2 });
    if (emailTaken) return res.status(409).json({ message: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hash,
      role: role === 'Teacher' ? 'Teacher' : 'User',
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err?.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ message: `${key === 'username' ? 'Username' : 'Email'} already in use` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email }).collation({ locale: 'vi', strength: 2 });
    if (!user) return res.status(400).json({ message: 'Incorrect email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Incorrect email or password' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
