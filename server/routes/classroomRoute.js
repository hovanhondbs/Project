// server/routes/classroomRoute.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
require('../models/User');
require('../models/FlashcardSet');

// Helpers
const toOid = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : v);
const emitTo = (req, userId, event, payload) => {
  try {
    const io = req.app.get('io');
    if (io && userId) io.to(String(userId)).emit(event, payload || {});
  } catch (_) {}
};

/* =========================
   CREATE CLASS
   ========================= */
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    const existing = await Classroom.findOne({ name, createdBy: toOid(createdBy) });
    if (existing) return res.status(409).json({ error: 'Lớp đã tồn tại' });

    const classroom = await Classroom.create({
      name,
      description,
      createdBy: toOid(createdBy),
    });
    res.status(201).json({ message: 'Lớp được tạo', classroomId: classroom._id });
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Không thể tạo lớp' });
  }
});

/* =========================
   LIST BY TEACHER / JOINED
   ========================= */
router.get('/by-user/:userId', async (req, res) => {
  try {
    const classes = await Classroom.find({ createdBy: req.params.userId })
      .populate('students', 'username email avatar')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: 'Không thể tải danh sách lớp' });
  }
});

router.get('/joined/:userId', async (req, res) => {
  try {
    // ⚠️ FIX: populate cả avatar của giáo viên
    const classes = await Classroom.find({ students: req.params.userId })
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: 'Không thể tải danh sách lớp đã tham gia' });
  }
});

/* =========================
   GET CLASS DETAIL
   ========================= */
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .select('name description students createdBy createdAt flashcards joinRequests')
      .populate({ path: 'createdBy', select: 'username avatar' })
      .populate('students', 'username email avatar')
      .populate('flashcards')
      .populate({ path: 'joinRequests.student', select: 'username avatar' });

    if (!classroom) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json(classroom);
  } catch (err) {
    console.error('Get class error:', err);
    res.status(500).json({ error: 'Không thể tải thông tin lớp' });
  }
});

/* =========================
   STUDENT REQUEST JOIN (PENDING)
   Emits: join:pending -> teacher
   ========================= */
router.post('/:id/request-join', async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    // đã trong lớp
    if ((classroom.students || []).some((s) => String(s) === String(studentId))) {
      return res.status(400).json({ error: 'Already joined' });
    }

    // đã có pending
    const existed = (classroom.joinRequests || []).find(
      (r) => String(r.student) === String(studentId) && r.status === 'pending'
    );
    if (!existed) {
      classroom.joinRequests.push({ student: toOid(studentId), status: 'pending', createdAt: new Date() });
      await classroom.save();
    }

    // 🔔 báo cho giáo viên (badge chuông)
    emitTo(req, classroom.createdBy, 'join:pending', {
      classId: classroom._id,
      className: classroom.name,
      createdAt: Date.now(),
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Request join error' });
  }
});

/* =========================
   TEACHER APPROVE / REJECT
   Emits: notif:new -> student
   ========================= */
router.post('/:id/approve', async (req, res) => {
  try {
    const { studentId, approve } = req.body; // true | false
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    const idx = (classroom.joinRequests || []).findIndex(
      (r) => String(r.student) === String(studentId) && r.status === 'pending'
    );
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    classroom.joinRequests[idx].status = approve ? 'approved' : 'rejected';
    if (approve) {
      classroom.joinRequests[idx].approvedAt = new Date();
      if (!(classroom.students || []).some((s) => String(s) === String(studentId))) {
        classroom.students.push(toOid(studentId));
      }
    }
    await classroom.save();

    // 🔔 tạo Notification cho học sinh
    const notif = await Notification.create({
      user: toOid(studentId),
      type: approve ? 'join_approved' : 'join_rejected',
      title: approve ? 'Join request approved' : 'Join request rejected',
      message: approve
        ? `You have been approved to join "${classroom.name}".`
        : `Your request to join "${classroom.name}" was rejected.`,
      link: approve ? `/classes/${classroom._id}` : `/`,
      seen: false,
      meta: { classId: classroom._id, approve: !!approve },
    });

    // 🔴 emit realtime tới học sinh (UserMenu đang nghe 'notif:new')
    emitTo(req, studentId, 'notif:new', { _id: notif._id });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Approve error' });
  }
});

/* =========================
   PENDING COUNT & LIST (CHO CHUÔNG GIÁO VIÊN)
   ========================= */
router.get('/pending-count/:teacherId', async (req, res) => {
  try {
    const classes = await Classroom.find({ createdBy: req.params.teacherId });
    const count = classes.reduce(
      (sum, c) => sum + (c.joinRequests || []).filter((r) => r.status === 'pending').length,
      0
    );
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: 'Count error' });
  }
});

router.get('/pending-requests/:teacherId', async (req, res) => {
  try {
    const classes = await Classroom.find({ createdBy: req.params.teacherId })
      .populate('joinRequests.student', 'username avatar');
    const list = [];
    classes.forEach((c) => {
      (c.joinRequests || []).forEach((r) => {
        if (r.status === 'pending' && r.student) {
          list.push({
            classId: c._id,
            className: c.name,
            studentId: r.student._id,
            studentName: r.student.username,
            studentAvatar: r.student.avatar,
            createdAt: r.createdAt,
          });
        }
      });
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

/* =========================
   MEMBERS LIST & REMOVE
   ========================= */
router.get('/:id/members', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10, sort = 'joinedAt', order = 'desc' } = req.query;
    const classroom = await Classroom.findById(req.params.id)
      .select('students joinRequests')
      .populate('students', 'username email avatar createdAt');
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    // map joinedAt từ joinRequests.approvedAt (fallback request.createdAt / user.createdAt)
    const joinedMap = {};
    (classroom.joinRequests || []).forEach((r) => {
      if (r.status === 'approved' && r.student) {
        joinedMap[String(r.student)] = r.approvedAt || r.createdAt || null;
      }
    });

    let list = (classroom.students || []).map((s) => ({
      _id: s._id,
      username: s.username,
      email: s.email,
      avatar: s.avatar || null,
      joinedAt: joinedMap[String(s._id)] || s.createdAt || null,
    }));

    const qq = (q || '').trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (it) =>
          (it.username || '').toLowerCase().includes(qq) ||
          (it.email || '').toLowerCase().includes(qq)
      );
    }

    const dir = order === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (sort === 'username') return (a.username || '').localeCompare(b.username || '') * dir;
      const ta = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const tb = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return (ta - tb) * dir;
    });

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.max(parseInt(limit, 10) || 10, 1);
    const total = list.length;
    const pages = Math.max(Math.ceil(total / lim), 1);
    const start = (p - 1) * lim;
    const items = list.slice(start, start + lim);

    res.json({ students: items, total, page: p, pages, limit: lim });
  } catch (e) {
    console.error('Members list error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/members/:studentId', async (req, res) => {
  try {
    const { requesterId } = req.body || {};
    const classroom = await Classroom.findById(req.params.id).select('createdBy students joinRequests');
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    if (!requesterId || String(classroom.createdBy) !== String(requesterId)) {
      return res.status(403).json({ error: 'Only class owner can remove members' });
    }

    const before = (classroom.students || []).length;
    classroom.students = (classroom.students || []).filter((s) => String(s) !== String(req.params.studentId));
    if (classroom.students.length === before) {
      return res.status(404).json({ error: 'Student not in class' });
    }
    await classroom.save();

    res.json({ ok: true });
  } catch (e) {
    console.error('Remove member error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
