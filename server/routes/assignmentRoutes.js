// server/routes/assignmentRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/AssignmentSubmission');
const Classroom = require('../models/Classroom');
const FlashcardSet = require('../models/FlashcardSet');
let Notification;
try { Notification = require('../models/Notification'); } catch (_) { /* optional */ }

const router = express.Router();

// Tạo assignment (Teacher)
router.post('/', async (req, res) => {
  try {
    const { classId, setId, mode, deadline, createdBy } = req.body;
    if (!classId || !setId || !mode || !deadline || !createdBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const classroom = await Classroom.findById(classId).populate('students createdBy', 'username avatar');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    if (String(classroom.createdBy._id) !== String(createdBy)) {
      return res.status(403).json({ message: 'Only class owner can create assignments' });
    }

    const set = await FlashcardSet.findById(setId).populate('userId', 'username');
    if (!set) return res.status(404).json({ message: 'Flashcard set not found' });
    if (String(set.userId?._id || set.userId) !== String(createdBy)) {
      return res.status(403).json({ message: 'You can only use your own flashcard sets' });
    }

    const a = await Assignment.create({
      classId,
      setId,
      createdBy,
      mode: mode === 'test' ? 'test' : 'learn',
      deadline: new Date(deadline),
      perQuestionSeconds: 30,
      totalQuestions: set.cards?.length || 0,
      title: set.title,
    });

    // Thông báo cho học sinh trong lớp
    if (classroom.students?.length && Notification) {
      const notifs = classroom.students.map((stu) => ({
        userId: stu,
        title: 'New assignment',
        message: `Your class has a new ${a.mode.toUpperCase()} assignment: ${set.title}`,
        link: `/classes/${classId}`,
      }));
      await Notification.insertMany(notifs).catch(() => {});
    }
    // Socket push
    try {
      const io = req.app.get('io');
      if (io && classroom.students) {
        classroom.students.forEach((stu) => io.to(String(stu)).emit('notif:new', { type: 'assignment' }));
      }
    } catch (_) {}

    res.status(201).json(a);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Danh sách assignment theo lớp (+ trạng thái của student)
router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId } = req.query;

    const list = await Assignment.find({ classId })
      .populate('setId', 'title cards')
      .sort('-createdAt');

    const results = await Promise.all(
      list.map(async (a) => {
        const submitted = studentId
          ? await Submission.findOne({ assignmentId: a._id, student: studentId })
          : null;
        const count = await Submission.countDocuments({ assignmentId: a._id });
        const now = new Date();
        return {
          _id: a._id,
          title: a.title || a.setId?.title,
          mode: a.mode,
          deadline: a.deadline,
          perQuestionSeconds: a.perQuestionSeconds,
          totalQuestions: a.totalQuestions || a.setId?.cards?.length || 0,
          createdAt: a.createdAt,
          submitted: !!submitted,
          score: submitted?.score || 0,
          total: submitted?.total || (a.totalQuestions || a.setId?.cards?.length || 0),
          submissionsCount: count,
          closed: now > a.deadline,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error('List assignments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy chi tiết assignment + bộ thẻ (để làm bài)
router.get('/:id', async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id)
      .populate('setId', 'title description cards')
      .populate('classId', 'name createdBy students');
    if (!a) return res.status(404).json({ message: 'Assignment not found' });

    res.json({
      _id: a._id,
      title: a.title || a.setId?.title,
      mode: a.mode,
      deadline: a.deadline,
      perQuestionSeconds: a.perQuestionSeconds,
      totalQuestions: a.totalQuestions || a.setId?.cards?.length || 0,
      set: a.setId,
      classId: a.classId?._id || a.classId,
    });
  } catch (err) {
    console.error('Get assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Kiểm tra đã nộp chưa
router.get('/:id/submission/:studentId', async (req, res) => {
  try {
    const sub = await Submission.findOne({
      assignmentId: req.params.id,
      student: req.params.studentId,
    });
    if (!sub) return res.json({ submitted: false });
    res.json({ submitted: true, score: sub.score, total: sub.total, submittedAt: sub.submittedAt });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Nộp bài (chỉ 1 lần, trong hạn)
router.post('/:id/submit', async (req, res) => {
  try {
    const { studentId, score, total, details } = req.body;
    if (!studentId) return res.status(400).json({ message: 'Missing studentId' });

    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Assignment not found' });

    const now = new Date();
    if (now > a.deadline) return res.status(400).json({ message: 'Deadline passed' });

    const doc = await Submission.create({
      assignmentId: a._id,
      student: new mongoose.Types.ObjectId(studentId),
      score: Number(score) || 0,
      total: Number(total) || (a.totalQuestions || 0),
      details: Array.isArray(details) ? details : [],
      startedAt: now,
      submittedAt: now,
    });

    // Thông báo cho giáo viên
    try {
      const classroom = await Classroom.findById(a.classId).populate('createdBy', '_id');
      if (Notification && classroom?.createdBy?._id) {
        await Notification.create({
          userId: classroom.createdBy._id,
          title: 'New submission',
          message: 'A student has submitted an assignment.',
          link: `/classes/${a.classId}`,
        });
        const io = req.app.get('io');
        io?.to(String(classroom.createdBy._id)).emit('notif:new', { type: 'submission' });
      }
    } catch (_) {}

    res.status(201).json({ submitted: true, score: doc.score, total: doc.total });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'You already submitted this assignment' });
    }
    console.error('Submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
