const mongoose = require('mongoose');

const flashcardSetSchema = new mongoose.Schema({
  title: String,
  description: String,
  owner: mongoose.Schema.Types.Mixed, // vì owner của bạn có lúc là ObjectId, có lúc là chuỗi
  isPublic: Boolean,
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
});

// ⚠️ Đây là dòng QUAN TRỌNG để đảm bảo Mongoose đọc đúng collection
module.exports = mongoose.model('FlashcardSet', flashcardSetSchema, 'flashcard_sets');
