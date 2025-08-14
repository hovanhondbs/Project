const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  targetSet: { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets', required: true },
  reporter:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason:    { type: String, default: '' },
  status:    { type: String, enum: ['open', 'resolved'], default: 'open' },
  action:    { type: String, enum: ['dismiss', 'hide', 'delete', null], default: null },
  resolvedAt:{ type: Date, default: null },
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
