// server/routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const FlashcardSet = require('../models/FlashcardSet');

const { Types } = mongoose;

/* ---------- Upload setup (safe filenames, /uploads/images) ---------- */
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images');
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

const toSafeFilename = (originalName) => {
  const ext = (path.extname(originalName) || '').toLowerCase();
  let base = path.basename(originalName, ext);

  // bỏ dấu tiếng Việt, ký tự lạ
  base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  base = base.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  base = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-_.]+|[-_.]+$/g, '').toLowerCase();
  if (!base) base = 'image';

  const safeExt = ext && /\.[a-z0-9]{2,5}$/.test(ext) ? ext : '.png';
  return `${Date.now()}-${base}${safeExt}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_DIR),
  filename: (req, file, cb) => cb(null, toSafeFilename(file.originalname)),
});

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const fileFilter = (req, file, cb) => (ALLOWED_MIME.includes(file.mimetype) ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE')));

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

/* ---------- Helpers ---------- */
const parseCards = (cards) => {
  try {
    const arr = typeof cards === 'string' ? JSON.parse(cards) : Array.isArray(cards) ? cards : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const asObjectId = (v) => (Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : v);

/* ---------- Routes ---------- */

// CREATE
router.post('/', upload.array('images[]'), async (req, res) => {
  try {
    const { title, description, userId, cards } = req.body;
    if (!title || !userId) return res.status(400).json({ message: 'Missing title or userId' });

    // unique title per user
    const exists = await FlashcardSet.findOne({ title, userId: asObjectId(userId) });
    if (exists) return res.status(409).json({ message: 'Title already exists' });

    const parsed = parseCards(cards);
    const imagePaths = (req.files || []).map((f) => path.posix.join('uploads', 'images', f.filename));
    const cardsWithImages = parsed.map((c, i) => ({ ...c, image: imagePaths[i] || c?.image || null }));

    const doc = await FlashcardSet.create({
      title,
      description,
      userId: asObjectId(userId),
      cards: cardsWithImages,
    });

    res.status(201).json({ message: 'Flashcard set created!', _id: doc._id });
  } catch (err) {
    console.error('Create set error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE
router.put('/:id', upload.array('images[]'), async (req, res) => {
  try {
    const { title, description, cards } = req.body;
    const parsed = parseCards(cards);
    const imagePaths = (req.files || []).map((f) => path.posix.join('uploads', 'images', f.filename));
    const updatedCards = parsed.map((c, i) => ({ ...c, image: imagePaths[i] || c?.image || null }));

    const set = await FlashcardSet.findById(req.params.id);
    if (!set) return res.status(404).json({ message: 'Không tìm thấy bộ thẻ' });

    set.title = title ?? set.title;
    set.description = description ?? set.description;
    set.cards = updatedCards;
    await set.save();

    res.json({ message: 'Đã cập nhật thành công' });
  } catch (err) {
    console.error('Update set error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật' });
  }
});

// LIST by user (dùng cho dropdown khi tạo Assignment)
router.get('/user/:userId', async (req, res) => {
  try {
    const uid = req.params.userId;
    const oid = asObjectId(uid);

    // tương thích các schema khác nhau (nếu bạn có)
    const orConds = [{ userId: oid }, { createdBy: oid }, { owner: oid }, { author: oid }];

    const sets = await FlashcardSet.find({ $or: orConds })
      .sort({ createdAt: -1 })
      .select('title description userId cards createdAt');

    res.json(sets || []);
  } catch (err) {
    console.error('Get sets by user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET by id (dùng cho FlashcardSetDetail, Learn/Test/Match)
router.get('/:id', async (req, res) => {
  try {
    const set = await FlashcardSet.findById(req.params.id).select('title description userId cards createdAt');
    if (!set) return res.status(404).json({ message: 'Không tìm thấy bộ thẻ' });
    res.json(set);
  } catch (err) {
    console.error('Get set by id error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await FlashcardSet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá thành công!' });
  } catch (err) {
    console.error('Delete set error:', err);
    res.status(500).json({ message: 'Lỗi khi xoá flashcard set' });
  }
});

module.exports = router;
