const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ✅ Thêm dòng này để liên kết flashcard
  flashcards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets' }]
});

module.exports = mongoose.model('classrooms', classroomSchema);
