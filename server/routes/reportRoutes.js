// server/routes/reportRoutes.js
const express = require('express');
const mongoose = require('mongoose');

const Report = require('../models/Report');
const FlashcardSet = require('../models/FlashcardSet');
const User = require('../models/User');
const Notification = require('../models/Notification');

const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const reportsLimiter = require('../middleware/rateLimitReports');
const recaptcha = require('../middleware/recaptcha');

const router = express.Router();

/* ======= Config ======= */
const ALLOWED_REASONS = new Set([
  'incorrect_content',
  'child_safety',
  'adult_content',
  'spam_or_ads',
]);

const MAX_REPORTS_24H_PER_USER = 10; // quota 24h
const SAME_SET_COOLDOWN_HOURS  = 12; // cooldown theo set
const AUTOHIDE_DISTINCT_REPORTERS_24H = 5; // auto-hide ngưỡng người khác nhau

const STRIKE_THRESHOLD   = 3; // số lần dismiss trong 7 ngày → ban
const STRIKE_WINDOW_DAYS = 7;
const BAN_HOURS          = 72;

const clamp = (s = '', max = 1000) => String(s || '').slice(0, max);

/* ======= Helpers ======= */
async function notifyUser(userId, { title, message, link = '', meta = {}, type = 'info' }) {
  try {
    await Notification.create({
      user: new mongoose.Types.ObjectId(userId),
      type,
      title: clamp(title, 200),
      message: clamp(message, 1000),
      link,
      meta,
    });
    try {
      const { emitToUser } = require('../socket');
      emitToUser(String(userId), 'notification', { title, message, link, meta, type });
    } catch {}
  } catch (err) {
    console.error('notifyUser error:', err?.message);
  }
}

/* ======= USER: tạo report ======= */
router.post('/', auth, reportsLimiter, recaptcha(true), async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { setId } = req.body || {};
    const reason = req.body?.reason || req.body?.reasonCode;
    const details = clamp(req.body?.details || '', 1000);

    if (!mongoose.isValidObjectId(setId)) return res.status(400).json({ error: 'invalid_set' });
    if (!ALLOWED_REASONS.has(String(reason))) return res.status(400).json({ error: 'invalid_reason' });

    // user bị ban report tạm thời?
    const me = await User.findById(userId).lean();
    if (me?.reportBanUntil && new Date(me.reportBanUntil) > new Date()) {
      return res.status(403).json({ error: 'report_temporarily_banned', until: me.reportBanUntil });
    }

    const set = await FlashcardSet.findById(setId).lean();
    if (!set) return res.status(404).json({ error: 'set_not_found' });
    if (String(set.userId) === String(userId)) {
      return res.status(400).json({ error: 'cannot_report_own_set' });
    }

    // quota 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count24h = await Report.countDocuments({ reporter: userId, createdAt: { $gte: since24h } });
    if (count24h >= MAX_REPORTS_24H_PER_USER) {
      return res.status(429).json({ error: 'too_many_reports_24h' });
    }

    // cooldown cùng set
    const sinceCooldown = new Date(Date.now() - SAME_SET_COOLDOWN_HOURS * 60 * 60 * 1000);
    const dup = await Report.findOne({
      reporter: userId,
      targetSet: setId,
      createdAt: { $gte: sinceCooldown },
      status: 'open',
    }).lean();
    if (dup) {
      return res.status(200).json({ ok: true, duplicated: true, message: 'already_reported_open' });
    }

    // tạo report
    const doc = await Report.create({
      targetSet: setId,
      reporter: userId,
      reason,
      status: 'open',
      action: null,
      details, // dùng được nếu schema Report của bạn có field details
    });

    // tăng đếm report
    try { await FlashcardSet.updateOne({ _id: setId }, { $inc: { reportCount: 1 } }); } catch {}

    // auto-hide nếu đủ ngưỡng người khác nhau trong 24h
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const distinctCount = await Report.distinct('reporter', { targetSet: setId, createdAt: { $gte: since } });
      if ((distinctCount?.length || 0) >= AUTOHIDE_DISTINCT_REPORTERS_24H) {
        await FlashcardSet.updateOne({ _id: setId }, { $set: { isHidden: true } });
        // Thông báo cho owner
        await notifyUser(set.userId, {
          title: 'Your set was auto-hidden',
          message: `Your set "${set.title}" has been temporarily hidden due to multiple reports and is under review.`,
          link: `/set/${setId}`,
          meta: { setId: String(setId), action: 'auto_hide' },
          type: 'warning',
        });
      }
    } catch (e) {
      console.error('auto-hide error:', e.message);
    }

    // báo admin
    const admins = await User.find({ role: 'Admin', status: { $ne: 'deleted' } }).select('_id').lean();
    await Promise.all(
      admins.map(a =>
        notifyUser(a._id, {
          title: 'New report submitted',
          message: `A flashcard set was reported: "${set.title}"`,
          link: '/admin/reports',
          meta: { setId: String(setId), reportId: String(doc._id), reason },
          type: 'info',
        })
      )
    );

    return res.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('create report error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/* ======= ADMIN: list ======= */
router.get('/admin/list', requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || 'open');
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));

    const match = {};
    if (status !== 'all') match.status = status;

    const [items, total] = await Promise.all([
      Report.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('targetSet', '_id title userId')
        .populate('reporter', '_id username email')
        .lean(),
      Report.countDocuments(match),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('admin list reports error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

/* ======= ADMIN: resolve ======= */
router.post('/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const action = String(req.body?.action || '');
    const note = clamp(req.body?.note || '', 2000);

    if (!['delete', 'hide', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'invalid_action' });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'report_not_found' });
    if (report.status !== 'open') {
      return res.status(400).json({ error: 'already_resolved' });
    }

    const set = await FlashcardSet.findById(report.targetSet);
    if (!set) {
      report.status = 'resolved';
      report.action = 'delete';
      report.resolvedAt = new Date();
      await report.save();
      return res.json({ ok: true });
    }

    if (action === 'delete') {
      const ownerId = set.userId;
      await FlashcardSet.deleteOne({ _id: set._id });

      report.status = 'resolved';
      report.action = 'delete';
      report.resolvedAt = new Date();
      await report.save();

      await notifyUser(ownerId, {
        title: 'Your set was removed',
        message: `Your set "${set.title}" was removed. Reason: ${note || 'policy violation'}.`,
        link: '/user/library',
        meta: { setId: String(set._id), action: 'delete' },
        type: 'warning',
      });
    }

    if (action === 'hide') {
      await FlashcardSet.updateOne({ _id: set._id }, { $set: { isHidden: true } });

      report.status = 'resolved';
      report.action = 'hide';
      report.resolvedAt = new Date();
      await report.save();

      await notifyUser(set.userId, {
        title: 'Your set was hidden',
        message: `Your set "${set.title}" is hidden for review. ${note ? `Reason: ${note}` : ''}`,
        link: `/set/${set._id}`,
        meta: { setId: String(set._id), action: 'hide' },
        type: 'info',
      });
    }

    if (action === 'dismiss') {
      // Strike/ban cho reporter
      const rep = await User.findById(report.reporter).lean();
      if (rep) {
        const now = new Date();
        const windowStart = new Date(Date.now() - STRIKE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        let strikes = 0;

        if (rep.reportStrikeUpdatedAt && new Date(rep.reportStrikeUpdatedAt) > windowStart) {
          strikes = rep.reportStrikeCount || 0;
        }

        strikes += 1;
        const update = {
          reportStrikeCount: strikes,
          reportStrikeUpdatedAt: now,
        };

        if (strikes >= STRIKE_THRESHOLD) {
          update.reportBanUntil = new Date(Date.now() + BAN_HOURS * 60 * 60 * 1000);
          update.reportStrikeCount = 0; // reset chu kỳ
        }

        await User.updateOne({ _id: rep._id }, { $set: update });
      }

      report.status = 'dismissed';
      report.action = 'dismiss';
      report.resolvedAt = new Date();
      await report.save();

      await notifyUser(report.reporter, {
        title: 'Report dismissed',
        message: `Your report for set "${set.title}" was dismissed. ${note ? `Reason: ${note}` : ''}`,
        link: `/set/${set._id}`,
        meta: { setId: String(set._id), action: 'dismiss' },
        type: 'info',
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('resolve report error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
