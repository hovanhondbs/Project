const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },
  role: { type: String, enum: ['User', 'Teacher'], default: 'User' },
  avatar: { type: String, default: '' },
  recentSets: [
    {
      setId: { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets' },
      lastViewed: { type: Date, default: Date.now }
    }
  ]
});

// ✅ Unique index cho username (không phân biệt hoa/thường)
userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('User', userSchema);