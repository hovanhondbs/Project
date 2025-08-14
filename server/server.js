const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// socket.io (nếu bạn đang dùng cho notifications)
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true },
});
app.set('io', io);
io.on('connection', (socket) => {
  const userId = socket.handshake.query?.userId;
  if (userId) socket.join(String(userId));
  socket.on('joinUserRoom', (uid) => uid && socket.join(String(uid)));
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_app';
mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB connected:', mongoose.connection.name));

app.get('/', (_req, res) => res.send('API running'));

// routes hiện có
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/flashcards', require('./routes/flashcardRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/search', require('./routes/searchRoute'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoute'));

// ✅ admin & reports
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server listening on', PORT));
