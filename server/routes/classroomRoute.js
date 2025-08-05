const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');

// ✅ Load để tránh lỗi populate FlashcardSet
require('../models/FlashcardSet');
require('../models/User');

// Tạo lớp mới
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    const existing = await Classroom.findOne({
      name,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    if (existing) {
      return res.status(400).json({ error: 'Tên lớp đã tồn tại' });
    }

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

// Lấy danh sách lớp của giáo viên
router.get('/by-user/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      createdBy: new mongoose.Types.ObjectId(req.params.userId),
    });
    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi tải danh sách lớp:', err);
    res.status(500).json({ error: 'Lỗi tải danh sách lớp' });
  }
});

// ✅ Lấy lớp đã tham gia (cho User)
router.get('/joined/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      students: new mongoose.Types.ObjectId(req.params.userId),
    }).populate('createdBy', 'username');
    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi lấy lớp đã tham gia:', err);
    res.status(500).json({ error: 'Không thể tải danh sách lớp đã tham gia' });
  }
});

// Lấy thông tin lớp theo ID
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('students', 'username email')
      .populate('flashcards');

    if (!classroom) return res.status(404).json({ error: 'Không tìm thấy lớp' });

    res.json(classroom);
  } catch (err) {
    console.error('Lỗi lấy lớp theo ID:', err);
    res.status(500).json({ error: 'Không thể lấy thông tin lớp học' });
  }
});

// Cập nhật lớp học
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const updated = await Classroom.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Lỗi cập nhật lớp:', err);
    res.status(500).json({ error: 'Không thể cập nhật lớp học' });
  }
});

// Xoá lớp
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Classroom.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error('Lỗi xoá lớp:', err);
    res.status(500).json({ error: 'Không thể xoá lớp' });
  }
});

// ✅ Học sinh tham gia lớp học
router.post('/:id/join', async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Nếu chưa tham gia mới thêm
    if (!classroom.students.includes(studentId)) {
      classroom.students.push(studentId);
      await classroom.save();
    }

    res.json({ message: 'Joined class successfully' });
  } catch (err) {
    console.error('Lỗi tham gia lớp:', err);
    res.status(500).json({ error: 'Không thể tham gia lớp' });
  }
});


module.exports = router;
