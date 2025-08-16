const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FlashcardSet = require('../models/FlashcardSet');
const Classroom = require('../models/Classroom');

router.get('/', async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) return res.json({ flashcards: [], classes: [] });

  try {
    const regex = new RegExp(query, 'i');

    // Ẩn set assignmentOnly + hidden khỏi Search
    const flashcards = await FlashcardSet.find({
      assignmentOnly: { $ne: true },
      hidden: { $ne: true },
      $or: [
        { title: regex },
        { description: regex },
        { 'cards.term': regex },
        { 'cards.definition': regex },
      ],
    })
      .select('title description cards userId createdAt')
      .populate({ path: 'userId', select: 'username avatar' });

    const classConds = [{ name: { $regex: regex } }, { description: { $regex: regex } }];
    if (mongoose.Types.ObjectId.isValid(query)) classConds.push({ _id: query });

    const classes = await Classroom.find({ $or: classConds })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' })
      .populate('students');

    res.json({ flashcards, classes });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

module.exports = router;
