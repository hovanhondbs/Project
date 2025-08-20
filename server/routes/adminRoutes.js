// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const FlashcardSet = require('../models/FlashcardSet');
const Report = require('../models/Report');

// ▶️ mailer
const {
  sendAccountSuspendedEmail,
  sendAccountReactivatedEmail,
} = require('../utils/mailer');

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

/** ----------- TIME-SERIES ----------- */
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
      { $project: {
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

/** ----------- USERS LIST ----------- */
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

/** ----------- CHANGE USER STATUS ----------- */
// PATCH /api/admin/users/:id/status  { status: 'suspended' | 'active' | 'deleted', hideSets?: boolean, reason?: string }
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid_user_id' });

    const next = String(req.body?.status || '').toLowerCase();
    const allowed = new Set(['active', 'suspended', 'deleted']);
    if (!allowed.has(next)) return res.status(400).json({ error: 'invalid_status' });

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'user_not_found' });
    if (target.role === 'Admin') return res.status(403).json({ error: 'cannot_modify_admin' });

    const prev = target.status || 'active';
    target.status = next === 'deleted' ? 'deleted' : next === 'suspended' ? 'suspended' : 'active';
    await target.save();

    const hideSets = req.body?.hideSets === true || req.body?.hideSets === 'true';
    const unhideSets = req.body?.unhideSets === true || req.body?.unhideSets === 'true';
    const reason = (req.body?.reason || '').toString().slice(0, 1000); // tránh quá dài

    if (next === 'suspended' && hideSets) {
      await FlashcardSet.updateMany({ userId: target._id }, { $set: { isHidden: true } });
    }
    if (next === 'active' && unhideSets) {
      await FlashcardSet.updateMany({ userId: target._id }, { $set: { isHidden: false } });
    }

    // GỬI EMAIL (không chặn response nếu lỗi)
    (async () => {
      try {
        if (next === 'suspended') {
          await sendAccountSuspendedEmail(target.email, { username: target.username, reason });
        } else if (prev === 'suspended' && next === 'active') {
          await sendAccountReactivatedEmail(target.email, { username: target.username });
        }
      } catch (mailErr) {
        console.warn('[adminRoutes] send mail failed:', mailErr?.message || mailErr);
      }
    })();

    res.json({
      ok: true,
      user: {
        _id: target._id,
        username: target.username,
        email: target.email,
        role: target.role,
        status: target.status,
      },
    });
  } catch (e) {
    console.error('update user status error:', e);
    res.status(500).json({ error: 'update_status_error' });
  }
});

module.exports = router;
