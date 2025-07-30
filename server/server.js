const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Kết nối route API flashcard
app.use('/api', require('./routes/flashcardRoutes'));

// 👉 Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/flashcard_app')
  .then(() => {
    console.log('Đã kết nối MongoDB');
    app.listen(5000, () => console.log('Server chạy tại http://localhost:5000'));
  })
  .catch((err) => console.error('❌ Lỗi MongoDB:', err));

// server.js
app.use('/api/auth', require('./routes/authRoutes'));

require('dotenv').config(); // ✅ đã đúng

const userRoute = require('./routes/userRoute');
app.use('/api/user', userRoute);
