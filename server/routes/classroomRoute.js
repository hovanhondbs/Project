// routes/classroomRoute.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification'); // tạo thông báo cho HS
const User = require('../models/User'); // để lấy tên/ảnh học sinh cho payload GV
require('../models/FlashcardSet');

const { emitToUser } = require('../socket'); // ✅ emit realtime tới user

// ===== Tạo lớp =====
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    if (!name?.trim() || !createdBy)
      return res.status(400).json({ error: 'Thiếu name hoặc createdBy' });

    const existing = await Classroom.findOne({
      name: name.trim(),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
    if (existing) return res.status(400).json({ error: 'Tên lớp đã tồn tại' });

    const classroom = new Classroom({
      name: name.trim(),
      description: description ?? '',
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    console.error('Lỗi tạo lớp:', err);
    res.status(500).json({ error: 'Không thể tạo lớp' });
  }
});

// ===== Lớp giáo viên tạo =====
router.get('/by-user/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      createdBy: new mongoose.Types.ObjectId(req.params.userId),
    })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' });

    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi tải danh sách lớp:', err);
    res.status(500).json({ error: 'Lỗi tải danh sách lớp' });
  }
});

// ===== Lớp người dùng đã tham gia =====
router.get('/joined/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      students: new mongoose.Types.ObjectId(req.params.userId),
    })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' });

    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi lấy lớp đã tham gia:', err);
    res.status(500).json({ error: 'Không thể tải danh sách lớp đã tham gia' });
  }
});

// ===== Lấy lớp theo id =====
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .select('name description students createdBy createdAt flashcards joinRequests')
      .populate({ path: 'createdBy', select: 'username avatar' })
      .populate('students', 'username email')
      .populate('flashcards')
      .populate({ path: 'joinRequests.student', select: 'username avatar' });

    if (!classroom) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json(classroom);
  } catch (err) {
    console.error('Lỗi lấy lớp theo ID:', err);
    res.status(500).json({ error: 'Không thể lấy thông tin lớp học' });
  }
});

// ===== Học sinh gửi REQUEST JOIN (không join thẳng) =====
router.post('/:id/request-join', async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    if (classroom.students.some(s => String(s) === String(studentId)))
      return res.status(400).json({ error: 'Already joined' });

    const existed = (classroom.joinRequests || []).find(
      r => String(r.student) === String(studentId) && r.status === 'pending'
    );
    if (existed) return res.json({ ok: true }); // idempotent

    classroom.joinRequests.push({ student: studentId, status: 'pending' });
    await classroom.save();

    // ✅ Realtime: báo cho giáo viên có yêu cầu mới
    try {
      const stu = await User.findById(studentId).select('username avatar');
      emitToUser(classroom.createdBy, 'join:pending', {
        classId: classroom._id,
        className: classroom.name,
        studentId,
        studentName: stu?.username || 'Student',
        studentAvatar: stu?.avatar || '',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('emit join:pending error', e?.message);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('request-join error', e);
    res.status(500).json({ error: 'Request join error' });
  }
});

// ===== Giáo viên duyệt / từ chối request trong chuông =====
router.post('/:id/approve', async (req, res) => {
  try {
    const { studentId, approve } = req.body; // true/false
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    const idx = (classroom.joinRequests || []).findIndex(
      r => String(r.student) === String(studentId) && r.status === 'pending'
    );
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    classroom.joinRequests[idx].status = approve ? 'approved' : 'rejected';
    if (approve && !classroom.students.map(String).includes(String(studentId))) {
      classroom.students.push(studentId);
    }
    await classroom.save();

    // ✅ Tạo thông báo DB cho HS
    const title = approve ? 'Join request approved' : 'Join request rejected';
    const message = approve
      ? `Your request to join "${classroom.name}" has been approved.`
      : `Your request to join "${classroom.name}" was rejected.`;
    const notif = await Notification.create({
      user: studentId,
      type: 'join_request_result',
      title,
      message,
      link: `/classes/${req.params.id}`,
      seen: false,
      meta: { classId: req.params.id, className: classroom.name, approve }
    });

    // ✅ Realtime: gửi ngay thông báo cho HS
    emitToUser(studentId, 'notif:new', {
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      type: notif.type,
      createdAt: notif.createdAt,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('approve error', e);
    res.status(500).json({ error: 'Approve error' });
  }
});

// ===== Badge chuông: đếm request pending của giáo viên =====
router.get('/pending-count/:teacherId', async (req, res) => {
  try {
    const classes = await Classroom.find({ createdBy: req.params.teacherId }, 'joinRequests');
    const count = classes.reduce(
      (sum, c) => sum + (c.joinRequests || []).filter(r => r.status === 'pending').length,
      0
    );
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: 'Count error' });
  }
});

// ===== Danh sách request pending để render dropdown =====
router.get('/pending-requests/:teacherId', async (req, res) => {
  try {
    const classes = await Classroom.find({ createdBy: req.params.teacherId })
      .populate('joinRequests.student', 'username avatar');

    const list = [];
    classes.forEach(c => {
      (c.joinRequests || []).forEach(r => {
        if (r.status === 'pending') {
          list.push({
            classId: c._id,
            className: c.name,
            studentId: r.student._id,
            studentName: r.student.username,
            studentAvatar: r.student.avatar,
            createdAt: r.createdAt
          });
        }
      });
    });

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// ===== UPDATE lớp =====
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const cls = await Classroom.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Không tìm thấy lớp' });

    if (name && name.trim() && name.trim() !== cls.name) {
      const dup = await Classroom.findOne({
        name: name.trim(),
        createdBy: cls.createdBy,
        _id: { $ne: cls._id }
      });
      if (dup) return res.status(400).json({ error: 'Tên lớp đã tồn tại' });
      cls.name = name.trim();
    }
    if (typeof description !== 'undefined') cls.description = description;

    await cls.save();

    const populated = await Classroom.findById(cls._id)
      .select('name description students createdBy createdAt flashcards joinRequests')
      .populate({ path: 'createdBy', select: 'username avatar' })
      .populate('students', 'username email')
      .populate('flashcards')
      .populate({ path: 'joinRequests.student', select: 'username avatar' });

    res.json(populated);
  } catch (err) {
    console.error('Lỗi cập nhật lớp:', err);
    res.status(500).json({ error: 'Không thể cập nhật lớp' });
  }
});

// ===== DELETE lớp =====
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Classroom.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Lỗi xoá lớp:', err);
    res.status(500).json({ error: 'Không thể xoá lớp' });
  }
});

module.exports = router;
