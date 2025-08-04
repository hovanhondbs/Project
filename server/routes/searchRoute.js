const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FlashcardSet = require('../models/FlashcardSet');
const Classroom = require('../models/Classroom');

router.get('/', async (req, res) => {
  const query = req.query.query?.trim();
  if (!query) return res.json({ flashcards: [], classes: [] });

  try {
    const regex = new RegExp(`^${query}$`, 'i'); // khớp chính xác
    const conditions = [{ name: { $regex: regex } }];

    // ✅ Nếu query là ObjectId hợp lệ, thì thêm điều kiện tìm theo _id
    if (mongoose.Types.ObjectId.isValid(query)) {
      conditions.push({ _id: query });
    }

    const flashcards = await FlashcardSet.find({
      title: { $regex: regex }
    });

    const classes = await Classroom.find({ $or: conditions });

    res.json({ flashcards, classes });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Lỗi tìm kiếm', details: err.message });
  }
});

module.exports = router;
