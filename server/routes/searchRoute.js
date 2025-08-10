const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FlashcardSet = require('../models/FlashcardSet');
const Classroom = require('../models/Classroom');

// GET /api/search?query=...
router.get('/', async (req, res) => {
  const query = req.query.query?.trim();
  if (!query) return res.json({ flashcards: [], classes: [] });

  try {
    const regex = new RegExp(query, 'i');
    const conditions = [{ name: { $regex: regex } }];

    if (mongoose.Types.ObjectId.isValid(query)) {
      conditions.push({ _id: query });
    }

    // ⚠️ Quan trọng: populate kèm 'avatar'
    const flashcards = await FlashcardSet.find({ title: { $regex: regex } })
      .select('title description cards userId createdAt')
      .populate({ path: 'userId', select: 'username avatar' });

    const classes = await Classroom.find({ $or: conditions })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' })
      .populate('students');

    res.json({ flashcards, classes });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Lỗi tìm kiếm', details: err.message });
  }
});

module.exports = router;
