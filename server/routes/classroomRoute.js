const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');

// Ensure models are loaded (in case of circular use elsewhere)
require('../models/User');
require('../models/FlashcardSet');

// Create a class
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

// 🔹 Classes created by a teacher (tab: Classes)
router.get('/by-user/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      createdBy: new mongoose.Types.ObjectId(req.params.userId),
    })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' }); // ✅ include avatar

    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi tải danh sách lớp:', err);
    res.status(500).json({ error: 'Lỗi tải danh sách lớp' });
  }
});

// 🔹 Classes the user joined (tab: My Classes)
router.get('/joined/:userId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      students: new mongoose.Types.ObjectId(req.params.userId),
    })
      .select('name description students createdBy createdAt')
      .populate({ path: 'createdBy', select: 'username avatar' }); // ✅ include avatar

    res.json(classrooms);
  } catch (err) {
    console.error('Lỗi lấy lớp đã tham gia:', err);
    res.status(500).json({ error: 'Không thể tải danh sách lớp đã tham gia' });
  }
});

// Get class by id
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .select('name description students createdBy createdAt flashcards')
      .populate({ path: 'createdBy', select: 'username avatar' }) // ✅ include avatar here too
      .populate('students', 'username email')
      .populate('flashcards');

    if (!classroom) return res.status(404).json({ error: 'Không tìm thấy lớp' });
    res.json(classroom);
  } catch (err) {
    console.error('Lỗi lấy lớp theo ID:', err);
    res.status(500).json({ error: 'Không thể lấy thông tin lớp học' });
  }
});

// Update class
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await Classroom.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Class not found' });
    res.json(updated);
  } catch (err) {
    console.error('Lỗi cập nhật lớp:', err);
    res.status(500).json({ error: 'Không thể cập nhật lớp học' });
  }
});

// Student join class
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

module.exports = router;