// routes/classroomRoute.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');

require('../models/User');
require('../models/FlashcardSet');

// Create class
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    const existing = await Classroom.findOne({
      name,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
    if (existing) return res.status(400).json({ error: 'Tên lớp đã tồn tại' });

    const classroom = new Classroom({
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    console.error('Lỗi tạo lớp:', err);
    res.status(500).json({ error: 'Không thể tạo lớp' });
  }
});

// Classes created by a teacher
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

// Classes the user joined
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

// Get class by id (include joinRequests so student sees "pending")
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

// (Optional) direct join
router.post('/:id/join', async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    if (!classroom.students.map(String).includes(String(studentId))) {
      classroom.students.push(studentId);
      await classroom.save();
    }
    res.json({ message: 'Joined class successfully' });
  } catch (err) {
    console.error('Lỗi tham gia lớp:', err);
    res.status(500).json({ error: 'Không thể tham gia lớp' });
  }
});

// Student sends JOIN REQUEST (needs approval)
router.post('/:id/request-join', async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    if (classroom.students.some(s => s.toString() === studentId))
      return res.status(400).json({ error: 'Already joined' });

    const existed = (classroom.joinRequests || []).find(
      r => r.student.toString() === studentId && r.status === 'pending'
    );
    if (existed) return res.json({ ok: true }); // idempotent

    classroom.joinRequests.push({ student: studentId, status: 'pending' });
    await classroom.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Request join error' });
  }
});

// Teacher approves / rejects
router.post('/:id/approve', async (req, res) => {
  try {
    const { studentId, approve } = req.body; // true | false
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ error: 'Class not found' });

    const idx = (classroom.joinRequests || []).findIndex(
      r => r.student.toString() === studentId && r.status === 'pending'
    );
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    classroom.joinRequests[idx].status = approve ? 'approved' : 'rejected';
    if (approve && !classroom.students.includes(studentId)) {
      classroom.students.push(studentId);
    }
    await classroom.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Approve error' });
  }
});

// Bell badge: count teacher's pending requests
router.get('/pending-count/:teacherId', async (req, res) => {
  try {
    const classes = await Classroom.find(
      { createdBy: req.params.teacherId },
      'joinRequests'
    );
    const count = classes.reduce(
      (sum, c) => sum + (c.joinRequests || []).filter(r => r.status === 'pending').length,
      0
    );
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: 'Count error' });
  }
});

// List items for the bell dropdown
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

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

module.exports = router;
