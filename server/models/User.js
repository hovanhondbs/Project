const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date },
  role: { type: String, enum: ['User', 'Teacher'], default: 'User' },

  // ✅ Thêm recentSets ở đây
  recentSets: [
    {
      setId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'flashcardsets'
      },
      lastViewed: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
