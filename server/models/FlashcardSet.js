const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  image: { type: String }
});

const flashcardSetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  userId: { type: String, required: true },
  cards: [cardSchema],
}, { timestamps: true });

module.exports = mongoose.model('flashcardsets', flashcardSetSchema);
