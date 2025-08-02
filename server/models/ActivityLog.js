const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
