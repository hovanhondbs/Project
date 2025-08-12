// server/server.js — enable Socket.IO + mount routes
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoute'));
app.use('/api/search', require('./routes/searchRoute'));
app.use('/api/notifications', require('./routes/notificationRoutes')); // thông báo cho HS

// ===== HTTP + Socket.IO
const server = http.createServer(app);
const { initSocket } = require('./socket');
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const io = initSocket(server, { origin: CLIENT_ORIGIN });

// Cho phép truy cập io ở mọi nơi nếu cần
app.locals.io = io;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_app';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Đã kết nối MongoDB');
    server.listen(PORT, () => {
      console.log(`Server chạy tại http://localhost:${PORT}`);
      console.log(`Socket.IO sẵn sàng, client origin: ${CLIENT_ORIGIN}`);
    });
  })
  .catch((err) => console.error('❌ Lỗi MongoDB:', err));
