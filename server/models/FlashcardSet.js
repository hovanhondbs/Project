const mongoose = require('mongoose');
const { Schema } = mongoose;

const cardSchema = new Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  image: { type: String }
});

const flashcardSetSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cards: [cardSchema],

    // flags cũ
    hidden: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },

    // ⬇️ THÊM: set dùng cho assignment -> ẩn khỏi kết quả search
    assignmentOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

flashcardSetSchema.index({ userId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('flashcardsets', flashcardSetSchema);
