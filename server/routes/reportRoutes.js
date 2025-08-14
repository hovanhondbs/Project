const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const requireAdmin = require('../middleware/requireAdmin');

const Report = require('../models/Report');
const FlashcardSet = require('../models/FlashcardSet');

// User gửi report
router.post('/', async (req, res) => {
  try {
    const { setId, reason = '' } = req.body || {};
    const token = (req.headers.authorization || '').startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    let reporter = null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      reporter = decoded?.id || null;
    }
    const rep = await Report.create({ targetSet: setId, reporter, reason, status: 'open' });
    await FlashcardSet.findByIdAndUpdate(setId, { $inc: { reportCount: 1 } });
    res.status(201).json(rep);
  } catch (e) {
    res.status(500).json({ error: 'report_create_error' });
  }
});

// Admin: danh sách report
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    const items = await Report.find({ status })
      .sort({ createdAt: -1 })
      .populate('targetSet', 'title userId hidden reportCount')
      .populate('reporter', 'username email');
    res.json({ items, total: items.length });
  } catch (e) {
    res.status(500).json({ error: 'report_list_error' });
  }
});

// Admin xử lý report
router.patch('/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { action } = req.body || {};
    const rep = await Report.findById(req.params.id);
    if (!rep) return res.status(404).json({ error: 'report_not_found' });

    if (action === 'hide') {
      await FlashcardSet.findByIdAndUpdate(rep.targetSet, { hidden: true });
    } else if (action === 'delete') {
      await FlashcardSet.findByIdAndDelete(rep.targetSet);
    }
    await Report.findByIdAndUpdate(rep._id, {
      status: 'resolved',
      action,
      resolvedAt: new Date(),
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'report_resolve_error' });
  }
});

module.exports = router;
