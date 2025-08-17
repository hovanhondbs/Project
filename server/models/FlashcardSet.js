const mongoose = require('mongoose');

const flashcardSetSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    cards: [
      {
        term:       { type: String, required: true },
        definition: { type: String, required: true },
        image:      { type: String, default: '' },
      },
    ],

    // (tuỳ dự án bạn dùng) public / class / private
    visibility: { type: String, enum: ['public', 'class', 'private'], default: 'public' },

    /* ===== moderation ===== */
    isHidden:    { type: Boolean, default: false }, // ẩn tạm khi bị nhiều report / admin hide
    reportCount: { type: Number,  default: 0 },     // đếm số report nhận được
  },
  { timestamps: true }
);

// Tìm kiếm full-text
flashcardSetSchema.index({
  title: 'text',
  description: 'text',
  'cards.term': 'text',
  'cards.definition': 'text',
});

// Tránh trùng tiêu đề trong phạm vi 1 user (tuỳ nhu cầu có thể bỏ)
flashcardSetSchema.index({ userId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('flashcardsets', flashcardSetSchema);
