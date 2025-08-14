const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true },
  password: { type: String, required: true },
  dob: { type: Date },

  // ✅ thêm Admin + trạng thái
  role: { type: String, enum: ['User', 'Teacher', 'Admin'], default: 'User' },
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },

  avatar: { type: String, default: '' },
  recentSets: [
    {
      setId: { type: mongoose.Schema.Types.ObjectId, ref: 'flashcardsets' },
      lastViewed: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

userSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('User', userSchema);
