// server/routes/adminPreviewRoutes.js
const express = require('express');
const mongoose = require('mongoose');

const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');

const FlashcardSet = require('../models/FlashcardSet');

const router = express.Router();

/**
 * Admin preview 1 bộ thẻ (bỏ qua isHidden). Chỉ admin mới xem.
 * GET /api/admin-preview/flashcards/:id
 */
router.get('/flashcards/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'invalid_set_id' });
    }

    const set = await FlashcardSet.findById(id)
      .populate('userId', '_id username email avatar')
      .lean();

    if (!set) return res.status(404).json({ error: 'set_not_found' });

    // Trả nguyên bộ thẻ kể cả khi isHidden === true
    return res.json(set);
  } catch (err) {
    console.error('admin preview set error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
