// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    dob:      { type: Date },

    role:   { type: String, enum: ['User', 'Teacher', 'Admin'], default: 'User' },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },

    avatar: { type: String, default: '' },

    recentSets: [
      {
        setId:      { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets' },
        lastViewed: { type: Date, default: Date.now },
      },
    ],

    // chống spam report
    reportStrikeCount:     { type: Number, default: 0 },
    reportStrikeUpdatedAt: { type: Date,   default: null },
    reportBanUntil:        { type: Date,   default: null },
  },
  { timestamps: true }
);

// KHÔNG thêm userSchema.index(...) ở dưới nữa
module.exports = mongoose.model('User', userSchema);
