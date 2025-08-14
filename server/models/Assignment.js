// server/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'classrooms', required: true },
    setId: { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['test', 'learn'], required: true },
    deadline: { type: Date, required: true },
    perQuestionSeconds: { type: Number, default: 30 },
    totalQuestions: { type: Number, default: 0 }, // snapshot lúc đăng
    title: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('assignments', assignmentSchema);
