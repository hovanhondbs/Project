// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Đếm thông báo CHƯA đọc
router.get('/count/:userId', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.params.userId, seen: false });
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'count_error' });
  }
});

// Lấy danh sách thông báo (mới nhất trước)
router.get('/list/:userId', async (req, res) => {
  try {
    const list = await Notification.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('title message link type seen createdAt');
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'list_error' });
  }
});

// Đánh dấu tất cả đã đọc
router.post('/mark-all-seen/:userId', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.params.userId, seen: false }, { $set: { seen: true } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'mark_error' });
  }
});

module.exports = router;
