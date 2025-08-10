// routes/userRoute.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/user/:id
 * Trả username, email, role, avatar
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email role avatar'); // <-- thêm avatar
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/user/:id/dob
 * Cập nhật ngày sinh + vai trò (nếu có)
 */
router.put('/:id/dob', async (req, res) => {
  try {
    const { dob, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { dob, role },
      { new: true }
    ).select('username email role avatar dob');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update DOB & Role' });
  }
});

/**
 * PUT /api/user/:id/recent-view
 * Cập nhật danh sách recentSets
 */
router.put('/:id/recent-view', async (req, res) => {
  try {
    const { setId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.recentSets = user.recentSets.filter(
      item => item.setId.toString() !== setId
    );
    user.recentSets.unshift({ setId, lastViewed: new Date() });
    user.recentSets = user.recentSets.slice(0, 10);

    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật recentSet' });
  }
});

/**
 * GET /api/user/:id/recents
 * Trả recentSets đã populate, lấy cả avatar của người tạo set
 */
router.get('/:id/recents', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'recentSets.setId',
        populate: { path: 'userId', select: 'username avatar' } // <-- avatar ở đây
      })
      .select('recentSets');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.recentSets);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy recentSets' });
  }
});

module.exports = router;
