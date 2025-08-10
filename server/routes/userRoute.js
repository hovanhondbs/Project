const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');

const router = express.Router();

// Tạo thư mục lưu avatar nếu chưa có
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage });

// 🔎 Check username availability (case-insensitive)
// GET /api/user/check-username?username=...
router.get('/check-username', async (req, res) => {
  try {
    const raw = (req.query.username || '').trim();
    if (!raw) return res.json({ available: false, reason: 'empty' });
    const found = await User.findOne({ username: raw }).collation({ locale: 'en', strength: 2 });
    res.json({ available: !found });
  } catch (err) {
    console.error('Check username error:', err);
    res.status(500).json({ available: false, error: 'server_error' });
  }
});

// GET /api/user/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email role avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/:id  — cập nhật avatar + username (chống trùng tên)
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const update = {};

    // ✅ Chặn trùng tên (case-insensitive) với người khác
    if (username && username.trim()) {
      const newName = username.trim();
      const exists = await User.findOne({ username: newName }).collation({ locale: 'en', strength: 2 });
      if (exists && String(exists._id) !== String(req.params.id)) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      update.username = newName;
    }

    if (req.file) {
      update.avatar = path.posix.join('uploads', 'avatars', req.file.filename);
    } else if (avatarUrl) {
      update.avatar = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('username email role avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    // Nếu lỗi index unique (E11000)
    if (err?.code === 11000) return res.status(409).json({ message: 'Username already taken' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/:id/dob
router.put('/:id/dob', async (req, res) => {
  try {
    const { dob, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { dob, role }, { new: true }).select('username email role avatar dob');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update DOB & Role' });
  }
});

// PUT /api/user/:id/recent-view
router.put('/:id/recent-view', async (req, res) => {
  try {
    const { setId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.recentSets = user.recentSets.filter(item => item.setId.toString() !== setId);
    user.recentSets.unshift({ setId, lastViewed: new Date() });
    user.recentSets = user.recentSets.slice(0, 10);

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật recentSet' });
  }
});

// GET /api/user/:id/recents
router.get('/:id/recents', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({ path: 'recentSets.setId', populate: { path: 'userId', select: 'username avatar' } })
      .select('recentSets');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.recentSets);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy recentSets' });
  }
});

module.exports = router;