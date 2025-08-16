// server/routes/assignmentRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/AssignmentSubmission');
const Classroom = require('../models/Classroom');
const FlashcardSet = require('../models/FlashcardSet');
let Notification;
try {
  Notification = require('../models/Notification');
} catch (_) {}

const router = express.Router();

/* -------------------------------------------
 * CREATE assignment  (Teacher / class owner)
 * ------------------------------------------- */
router.post('/', async (req, res) => {
  try {
    const { classId, setId, mode, deadline, createdBy } = req.body;
    if (!classId || !setId || !mode || !deadline || !createdBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const classroom = await Classroom.findById(classId).populate('students createdBy', 'username avatar');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    // Only the class owner (teacher) can create assignments
    if (String(classroom.createdBy?._id || classroom.createdBy) !== String(createdBy)) {
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

    // Notify students
    if (classroom.students?.length && Notification) {
      const docs = classroom.students.map((stu) => ({
        userId: stu,
        title: 'New assignment',
        message: `Your class has a new ${a.mode.toUpperCase()} assignment: ${set.title}`,
        link: `/classes/${classId}`,
      }));
      await Notification.insertMany(docs).catch(() => {});
    }

    // Socket notify
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

/* -------------------------------------------
 * LIST assignments of a class (+ student state)
 * ------------------------------------------- */
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

/* -------------------------------------------
 * GET assignment detail (+ set)
 * ------------------------------------------- */
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

/* -------------------------------------------
 * CHECK submission state for a student
 * ------------------------------------------- */
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

/* -------------------------------------------
 * SUBMIT assignment (only once, before deadline)
 * ------------------------------------------- */
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

    // Notify teacher
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

/* -------------------------------------------
 * RESULTS (teacher sees all, student sees own)
 * ------------------------------------------- */
router.get('/class/:classId/results', async (req, res) => {
  try {
    const { classId } = req.params;
    const { viewerId } = req.query;

    const classroom = await Classroom.findById(classId)
      .populate('createdBy', '_id username')
      .populate('students', '_id username');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const isTeacher = viewerId && String(classroom.createdBy?._id) === String(viewerId);

    const assignments = await Assignment.find({ classId })
      .select('_id title mode deadline totalQuestions')
      .sort({ createdAt: -1 })
      .lean();

    const aIds = assignments.map((a) => a._id);
    const subQuery = { assignmentId: { $in: aIds } };
    if (!isTeacher && viewerId) subQuery['student'] = viewerId;

    const subs = await Submission.find(subQuery)
      .populate('student', '_id username')
      .select('assignmentId student score total submittedAt')
      .lean();

    // Map submissions: assignmentId -> studentId -> submission
    const subMap = {};
    for (const s of subs) {
      const aId = String(s.assignmentId);
      const uId = String(s.student?._id || s.student);
      if (!subMap[aId]) subMap[aId] = {};
      subMap[aId][uId] = s;
    }

    const results = [];
    if (isTeacher) {
      // All students x all assignments
      for (const a of assignments) {
        for (const stu of classroom.students || []) {
          const s = subMap[String(a._id)]?.[String(stu._id)];
          results.push({
            assignmentId: a._id,
            assignmentTitle: a.title,
            mode: a.mode,
            deadline: a.deadline,
            total: s?.total ?? (a.totalQuestions || 0),
            studentId: stu._id,
            studentName: stu.username,
            score: s?.score ?? null,
            submittedAt: s?.submittedAt ?? null,
            status: s ? 'submitted' : 'not_submitted',
          });
        }
      }
    } else {
      // Only this student's results
      const me = viewerId;
      for (const a of assignments) {
        const s = subMap[String(a._id)]?.[String(me)];
        if (s) {
          results.push({
            assignmentId: a._id,
            assignmentTitle: a.title,
            mode: a.mode,
            deadline: a.deadline,
            total: s.total ?? (a.totalQuestions || 0),
            studentId: s.student?._id || s.student,
            studentName: s.student?.username || '',
            score: s.score,
            submittedAt: s.submittedAt,
            status: 'submitted',
          });
        }
      }
    }

    res.json({
      role: isTeacher ? 'teacher' : 'student',
      assignments,
      results,
    });
  } catch (err) {
    console.error('Results error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* -------------------------------------------
 * DELETE assignment  (Teacher / class owner)
 * - Only class owner (createdBy of classroom) OR
 *   creator of the assignment can delete
 * - Also deletes all submissions of that assignment
 * ------------------------------------------- */
router.delete('/:id', async (req, res) => {
  try {
    const { requesterId } = req.body || {};
    if (!requesterId) return res.status(400).json({ message: 'Missing requesterId' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const classroom = await Classroom.findById(assignment.classId).select('createdBy');
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    const isOwner = String(classroom.createdBy) === String(requesterId);
    const isCreator = String(assignment.createdBy) === String(requesterId);
    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Not allowed to delete this assignment' });
    }

    await Submission.deleteMany({ assignmentId: assignment._id });
    await Assignment.deleteOne({ _id: assignment._id });

    return res.json({ deleted: true });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
