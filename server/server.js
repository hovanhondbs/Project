// server/server.js
require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const app = express();

/* -------------------- ENV -------------------- */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcard_app';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

/* -------------------- DB -------------------- */
mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('[MongoDB] connected'))
  .catch((err) => {
    console.error('[MongoDB] connect error:', err.message);
    process.exit(1);
  });

/* -------------------- Middlewares -------------------- */
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* -------------------- Routes -------------------- */
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoute');
const searchRoute = require('./routes/searchRoute');

const classroomRoute = require('./routes/classroomRoute');
const flashcardRoutes = require('./routes/flashcardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
let reportRoutes;
try {
  reportRoutes = require('./routes/reportRoutes');
} catch (_) {}

const adminRoutes = require('./routes/adminRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes'); // <-- NEW

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/search', searchRoute);

app.use('/api/classrooms', classroomRoute);x
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
if (reportRoutes) app.use('/api/reports', reportRoutes);

// mount admin + assignments
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes); // <-- IMPORTANT

// health check
app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

/* -------------------- Socket.io -------------------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('register', ({ userId }) => {
    if (userId) socket.join(String(userId));
  });
});

/* -------------------- Start -------------------- */
server.listen(PORT, () => {
  console.log(`[Server] listening on http://localhost:${PORT}`);
  console.log(`[Server] CORS origin: ${CLIENT_ORIGIN}`);
});
