const mongoose = require('mongoose');
const { Schema } = mongoose; // ✅ Thêm dòng này

const cardSchema = new Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  image: { type: String }
});

const flashcardSetSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // ✅ đúng kiểu
  cards: [cardSchema],
}, { timestamps: true });

flashcardSetSchema.index({ userId: 1, title: 1 }, { unique: true }); // ✅ index chuẩn

module.exports = mongoose.model('flashcardsets', flashcardSetSchema);
