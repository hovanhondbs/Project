// server/server.js
require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

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

/* -------------------- CORS & Parsers -------------------- */
const corsOptions = {
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* -------------------- Static -------------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* -------------------- Routes -------------------- */
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoute');
const searchRoute = require('./routes/searchRoute');
const classroomRoute = require('./routes/classroomRoute');
const flashcardRoutes = require('./routes/flashcardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const adminPreviewRoutes = require('./routes/adminPreviewRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/search', searchRoute);
app.use('/api/classrooms', classroomRoute);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin-preview', adminPreviewRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' })
);

/* -------------------- Socket.io -------------------- */
const server = http.createServer(app);
const socket = require('./socket');
socket.init(server, CLIENT_ORIGIN);

/* -------------------- Start -------------------- */
server.listen(PORT, () => {
  console.log(`[Server] listening on http://localhost:${PORT}`);
  console.log(`[Server] CORS origin: ${CLIENT_ORIGIN}`);
});
