// server.js — clean & single-source authRoutes
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/authRoutes'));       // ✅ keep this (NEW routes with check-username)
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoute'));
app.use('/api/search', require('./routes/searchRoute'));

// db + server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_app')
  .then(() => {
    console.log('Đã kết nối MongoDB');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server chạy tại http://localhost:${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error('❌ Lỗi MongoDB:', err));
