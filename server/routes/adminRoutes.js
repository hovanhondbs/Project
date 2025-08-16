// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const FlashcardSet = require('../models/FlashcardSet');
const Report = require('../models/Report');

router.use(requireAdmin);

/** ----------- OVERVIEW KPIs ----------- */
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

/** ----------- TIME-SERIES: New users / Cards created / DAU ----------- */
// GET /api/admin/stats/timeseries?days=30
router.get('/stats/timeseries', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(120, parseInt(req.query.days || '30', 10)));
    const end = new Date();
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const allDays = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      allDays.push(d.toISOString().slice(0, 10));
    }

    const usersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]);

    const cardsAgg = await FlashcardSet.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cardCount: { $size: { $ifNull: ['$cards', []] } },
        },
      },
      { $group: { _id: '$day', cards: { $sum: '$cardCount' } } },
    ]);

    let dauFromSubs = [];
    try {
      dauFromSubs = await mongoose.connection.collection('assignment_submissions').aggregate([
        { $addFields: { _submittedAt: { $ifNull: ['$submittedAt', '$createdAt'] } } },
        { $match: { _submittedAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$_submittedAt' } }, users: { $addToSet: '$userId' } } },
        { $project: { _id: 1, dauPart: { $size: '$users' } } },
      ]).toArray();
    } catch { dauFromSubs = []; }

    let dauFromActs = [];
    try {
      dauFromActs = await mongoose.connection.collection('activitylogs').aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, users: { $addToSet: '$userId' } } },
        { $project: { _id: 1, dauPart: { $size: '$users' } } },
      ]).toArray();
    } catch { dauFromActs = []; }

    const mapUsers = new Map(usersAgg.map(x => [x._id, x.count]));
    const mapCards = new Map(cardsAgg.map(x => [x._id, x.cards]));
    const mapDauSub = new Map(dauFromSubs.map(x => [x._id, x.dauPart]));
    const mapDauAct = new Map(dauFromActs.map(x => [x._id, x.dauPart]));

    const series = allDays.map(day => ({
      date: day,
      newUsers: mapUsers.get(day) || 0,
      cards: mapCards.get(day) || 0,
      dau: (mapDauSub.get(day) || 0) + (mapDauAct.get(day) || 0),
    }));

    res.json({ start: start.toISOString(), end: end.toISOString(), days, series });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'timeseries_error' });
  }
});

/** ----------- USERS LIST (quan trọng) ----------- */
// GET /api/admin/users?q=&role=&status=&page=1&limit=10
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));

    const q = (req.query.q || '').trim();
    const role = (req.query.role || '').trim();
    const status = (req.query.status || '').trim();

    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ username: rx }, { email: rx }];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      items: items.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      })),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'users_list_error' });
  }
});

module.exports = router;
