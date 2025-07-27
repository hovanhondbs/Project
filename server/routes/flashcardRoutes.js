const express = require('express');
const router = express.Router();
const FlashcardSet = require('../models/FlashcardSet');
const Flashcard = require('../models/Flashcard');

// GET /api/sets – Lấy tất cả bộ thẻ (hoặc theo owner)
router.get('/sets', async (req, res) => {
  try {
    const owner = req.query.owner;
    const filter = owner ? { owner } : {};
    const sets = await FlashcardSet.find(filter).sort({ createdAt: -1 });
    res.json(sets);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy bộ thẻ', error: err.message });
  }
});

// GET /api/flashcards?setId=... – Lấy tất cả thẻ trong 1 bộ
router.get('/flashcards', async (req, res) => {
  try {
    const { setId } = req.query;
    if (!setId) return res.status(400).json({ message: 'Thiếu setId' });

    const cards = await Flashcard.find({ setId });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy flashcards', error: err.message });
  }
});

module.exports = router;
