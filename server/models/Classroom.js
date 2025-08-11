// models/Classroom.js
const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt:   { type: Date, default: Date.now },
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Link flashcard sets (if you use them)
  flashcards:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets' }],

  // Join-approval workflow
  joinRequests: [
    {
      student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      createdAt:{ type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('classrooms', classroomSchema);
