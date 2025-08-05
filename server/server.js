const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Kết nối route API flashcard
const flashcardRoutes = require('./routes/flashcardRoutes');
app.use('/api/flashcards', flashcardRoutes);


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

// Cho phép truy cập ảnh đã upload
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 👉 Kết nối route API activity logger
app.use(express.json());
const activityRoutes = require("./routes/activityRoutes");
app.use("/api/activity", activityRoutes);
const classroomRoutes = require('./routes/classroomRoute');
app.use('/api/classrooms', classroomRoutes);

// 👉 Kết nối route API search
const searchRoute = require('./routes/searchRoute');
app.use('/api/search', searchRoute);

