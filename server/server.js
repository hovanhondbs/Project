// server/server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('register', ({ userId }) => {
    if (userId) socket.join(String(userId));
  });
  socket.on('disconnect', () => {});
});

// middleware
app.use(cors());
app.use(express.json());

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoute'));
app.use('/api/search', require('./routes/searchRoute'));
try { app.use('/api/notifications', require('./routes/notificationRoutes')); } catch (_) {}
app.use('/api/assignments', require('./routes/assignmentRoutes'));

// db + server
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_app';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  server.listen(PORT, () => console.log(`Server at http://localhost:${PORT}`));
}).catch((err) => {
  console.error('MongoDB error:', err);
  process.exit(1);
});
