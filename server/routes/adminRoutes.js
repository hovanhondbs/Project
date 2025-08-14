// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const FlashcardSet = require('../models/FlashcardSet');
const Report = require('../models/Report');

// TẤT CẢ endpoints admin đều cần admin
router.use(requireAdmin);

// ========== OVERVIEW (giữ nguyên) ==========
router.get('/stats/overview', async (_req, res) => {
  try {
    const [totalUsers, totalTeachers, totalClasses, totalSets, openReports] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'Teacher' }),
      Classroom.countDocuments({}),
      FlashcardSet.countDocuments({}),
      Report.countDocuments({ status: 'open' }),
    ]);
    res.json({ totalUsers, totalTeachers, totalClasses, totalSets, openReports });
  } catch (e) {
    res.status(500).json({ error: 'stats_error' });
  }
});

// ========== TIME-SERIES (MỚI) ==========
// GET /api/admin/stats/timeseries?days=30
// Trả về mảng [{date:'YYYY-MM-DD', newUsers, submissions, dau}]
router.get('/stats/timeseries', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(120, parseInt(req.query.days || '30', 10)));
    const end = new Date(); // now
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1)); // ví dụ 30 ngày -> lùi 29

    // Helper: build all dates
    const allDays = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      allDays.push(key);
    }

    // 1) New users per day
    const usersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);

    // 2) Submissions per day (đọc trực tiếp collection để không cần Model)
    const subsAgg = await mongoose.connection
      .collection('assignment_submissions')
      .aggregate([
        {
          $addFields: {
            _submittedAt: { $ifNull: ['$submittedAt', '$createdAt'] },
          },
        },
        { $match: { _submittedAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$_submittedAt' } },
            count: { $sum: 1 },
            // DAU một phần từ submissions (distinct user/day)
            users: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            dauPart: { $size: '$users' },
          },
        },
      ])
      .toArray();

    // 3) DAU từ activity logs (nếu có)
    let actAgg = [];
    try {
      actAgg = await mongoose.connection
        .collection('activitylogs')
        .aggregate([
          { $match: { createdAt: { $gte: start } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              users: { $addToSet: '$userId' },
            },
          },
          { $project: { _id: 1, dauPart: { $size: '$users' } } },
        ])
        .toArray();
    } catch {
      actAgg = [];
    }

    // Map -> merge
    const mapUsers = new Map(usersAgg.map((x) => [x._id, x.count]));
    const mapSubs = new Map(subsAgg.map((x) => [x._id, { submissions: x.count, dauPart: x.dauPart }]));
    const mapActs = new Map(actAgg.map((x) => [x._id, x.dauPart]));

    const out = allDays.map((key) => {
      const newUsers = mapUsers.get(key) || 0;
      const subInfo = mapSubs.get(key) || { submissions: 0, dauPart: 0 };
      const dauAct = mapActs.get(key) || 0;
      const dau = subInfo.dauPart + dauAct; // union xấp xỉ (chấp nhận double count nhỏ)
      return { date: key, newUsers, submissions: subInfo.submissions, dau };
    });

    res.json({ start: start.toISOString(), end: end.toISOString(), days, series: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'timeseries_error' });
  }
});

module.exports = router;
