// server/models/AssignmentSubmission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'assignments', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    details: { type: Array, default: [] }, // tuỳ chọn: log từng câu
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Một học sinh chỉ nộp 1 lần cho 1 assignment
submissionSchema.index({ assignmentId: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('assignment_submissions', submissionSchema);
