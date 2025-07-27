const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  question: String,
  answer: String,
  setId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardSet' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Flashcard', flashcardSchema);
