const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const FlashcardSet = require('../models/FlashcardSet');

// Setup lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Tạo flashcard set
router.post('/', upload.array('images[]'), async (req, res) => {
  try {
    const { title, description, cards, userId } = req.body;

    // Kiểm tra trùng tiêu đề
    const existing = await FlashcardSet.findOne({ title, userId });
    if (existing) {
      return res.status(409).json({ message: 'Title already exists' });
    }

    const parsedCards = JSON.parse(cards);
    const imagePaths = req.files.map(file => file.path);

    const cardsWithImages = parsedCards.map((card, index) => ({
      ...card,
      image: imagePaths[index] || null
    }));

    const newSet = new FlashcardSet({
      title,
      description,
      userId,
      cards: cardsWithImages,
    });

    await newSet.save();
    res.status(201).json({ message: 'Flashcard set created!' });
  } catch (err) {
    console.error('Error saving flashcard set:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Cập nhật flashcard set
router.put('/:id', upload.array('images[]'), async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    const parsedCards = JSON.parse(req.body.cards);
    const imagePaths = req.files.map(file => file.path);

    const updatedCards = parsedCards.map((card, index) => ({
      ...card,
      image: imagePaths[index] || card.image || null
    }));

    const existingSet = await FlashcardSet.findById(req.params.id);
    if (!existingSet) return res.status(404).json({ message: 'Không tìm thấy bộ thẻ' });

    existingSet.title = title;
    existingSet.description = description;
    existingSet.cards = updatedCards;
    await existingSet.save();

    res.json({ message: 'Đã cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật' });
  }
});


// Lấy tất cả flashcard set theo userId
router.get('/user/:userId', async (req, res) => {
  try {
    const sets = await FlashcardSet.find({ userId: req.params.userId });
    res.json(sets);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách flashcard sets:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Lấy chi tiết flashcard set theo id
router.get('/:id', async (req, res) => {
  try {
    const set = await FlashcardSet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ message: 'Không tìm thấy bộ thẻ' });
    }
    res.json(set);
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết flashcard set:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xoá flashcard set
router.delete('/:id', async (req, res) => {
  try {
    await FlashcardSet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi xoá flashcard set' });
  }
});

module.exports = router;
