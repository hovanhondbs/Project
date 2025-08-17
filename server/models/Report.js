// server/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    targetSet: { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets', required: true, index: true },
    reporter:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Lý do chọn theo enum + details tuỳ chọn
    reason:    { 
      type: String, 
      enum: ['incorrect_content', 'child_safety', 'adult_content', 'spam_or_ads'], 
      required: true 
    },
    details:   { type: String, default: '' },

    // Trạng thái/biện pháp xử lý
    status:    { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    action:    { type: String, enum: ['dismiss', 'hide', 'delete', null], default: null },

    // Dấu thời gian & ghi chú admin
    resolvedAt:   { type: Date, default: null },
    dismissedAt:  { type: Date, default: null },
    adminNote:    { type: String, default: '' },
  },
  { timestamps: true }
);

// Chặn report trùng: cùng reporter + targetSet đang "open"
reportSchema.index({ reporter: 1, targetSet: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'open' } });

// Truy vấn nhanh
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('reports', reportSchema);
