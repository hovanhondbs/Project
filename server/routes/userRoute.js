// server/routes/userRoute.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');

const router = express.Router();

/** ---------- Rules giống đăng ký ---------- */
// Cho phép chữ Unicode có dấu (L/M), số (N), dấu chấm, gạch dưới, khoảng trắng; 3–20 ký tự
const USERNAME_REGEX = /^[\p{L}\p{M}\p{N}._ ]{3,20}$/u;
const isAllDigits = (s) => /^\d+$/.test((s || '').replace(/\s+/g, ''));
const looksLikeEmail = (s) => /@/.test(s || '');

/** ---------- Paths & upload ---------- */
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const toSafeFilename = (originalName) => {
  const ext = (path.extname(originalName) || '').toLowerCase();
  let base = path.basename(originalName, ext);

  base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  base = base.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  base = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-_.]+|[-_.]+$/g, '').toLowerCase();

  if (!base) base = 'file';
  const safeExt = ext && /\.[a-z0-9]{2,5}$/.test(ext) ? ext : '.png';
  return `${Date.now()}-${base}${safeExt}`;
};

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => cb(null, toSafeFilename(file.originalname)),
});
const fileFilter = (req, file, cb) => (ALLOWED_MIME.includes(file.mimetype) ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE')));
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/** ---------- API ---------- */

// (Optional) check username (dành cho editor – có thể gọi, không bắt buộc)
router.get('/check-username', async (req, res) => {
  try {
    const raw = (req.query.username || '').trim();
    if (!raw) return res.json({ available: false, reason: 'empty' });
    const found = await User.findOne({ username: raw }).collation({ locale: 'vi', strength: 2 });
    res.json({ available: !found });
  } catch (err) {
    res.status(500).json({ available: false, error: 'server_error' });
  }
});

// GET /api/user/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email role avatar dob');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/:id — cập nhật username (ràng buộc như đăng ký) + avatar
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const update = {};

    // --- Validate & đổi username nếu gửi lên ---
    if (typeof username !== 'undefined') {
      const newName = (username || '').trim();

      if (!USERNAME_REGEX.test(newName)) {
        return res.status(400).json({
          message: 'Username must be 3–20 characters and can include Vietnamese letters, spaces, dot, and underscore',
        });
      }
      if (isAllDigits(newName)) {
        return res.status(400).json({ message: 'Username cannot be numbers only' });
      }
      if (looksLikeEmail(newName)) {
        return res.status(400).json({ message: 'Username cannot be an email address' });
      }

      // case-insensitive (tiếng Việt), bỏ qua chính mình
      const existed = await User.findOne({ username: newName }).collation({ locale: 'vi', strength: 2 });
      if (existed && String(existed._id) !== String(req.params.id)) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      update.username = newName;
    }

    // --- Avatar: file upload hoặc url gợi ý ---
    if (req.file) {
      update.avatar = path.posix.join('uploads', 'avatars', req.file.filename);
    } else if (avatarUrl) {
      update.avatar = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('username email role avatar dob');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    if (err?.code === 11000) return res.status(409).json({ message: 'Username already taken' });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/:id/dob (giữ nguyên nếu bạn đang dùng)
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

// recent views (giữ nguyên)
router.put('/:id/recent-view', async (req, res) => {
  try {
    const { setId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.recentSets = user.recentSets.filter((it) => String(it.setId) !== String(setId));
    user.recentSets.unshift({ setId, lastViewed: new Date() });
    user.recentSets = user.recentSets.slice(0, 10);

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật recentSet' });
  }
});

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
