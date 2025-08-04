const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ Thêm dòng này
const Classroom = require('../models/Classroom');

// Tạo lớp mới
router.post('/', async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    // ✅ Ép kiểu createdBy sang ObjectId để so sánh đúng
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

module.exports = router;
