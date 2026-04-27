const router = require('express').Router();
const Homework = require('../models/Homework');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;
    const hw = await Homework.find(filter).populate('teacherId', 'name').sort('-dueDate');
    res.json(hw);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { classId, title, description, dueDate } = req.body;
    // Auto-create pending submissions for all students in class
    const students = await User.find({ classId, role: 'student' });
    const submissions = students.map(s => ({ studentId: s._id, status: 'pending' }));
    const hw = new Homework({ classId, title, description, dueDate, teacherId: req.user._id, submissions });
    await hw.save();
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit homework
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { title, description, dueDate } = req.body;
    const hw = await Homework.findByIdAndUpdate(req.params.id, { title, description, dueDate }, { new: true });
    if (!hw) return res.status(404).json({ error: 'לא נמצא' });
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete homework
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    await Homework.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single homework with populated submissions
router.get('/:id', auth, async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id)
      .populate('teacherId', 'name')
      .populate('submissions.studentId', 'name avatar');
    if (!hw) return res.status(404).json({ error: 'לא נמצא' });
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Grade a submission
router.post('/:id/grade', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { studentId, grade } = req.body;
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).json({ error: 'לא נמצא' });
    const sub = hw.submissions.find(s => s.studentId.toString() === studentId);
    if (!sub) return res.status(404).json({ error: 'תלמיד לא נמצא' });
    sub.grade = grade;
    sub.status = 'graded';
    await hw.save();
    // Award bonus points for good grades
    if (grade >= 90) {
      await User.findByIdAndUpdate(studentId, { $inc: { points: 5 } });
    } else if (grade >= 70) {
      await User.findByIdAndUpdate(studentId, { $inc: { points: 2 } });
    }
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit homework
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const hw = await Homework.findById(req.params.id);
    if (!hw) return res.status(404).json({ error: 'שיעורי בית לא נמצאו' });
    const sub = hw.submissions.find(s => s.studentId.toString() === req.user._id.toString());
    if (sub) {
      sub.status = new Date() > hw.dueDate ? 'late' : 'submitted';
      sub.submittedAt = new Date();
    }
    await hw.save();
    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 3, 'streaks.homework': 1 } });
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const classId = req.query.classId;
    const homeworks = await Homework.find({ classId });
    const total = homeworks.length;
    const totalSubs = homeworks.reduce((acc, hw) => acc + (hw.submissions?.length || 0), 0);
    const submitted = homeworks.reduce((acc, hw) => acc + (hw.submissions?.filter(s => s.status !== 'pending').length || 0), 0);
    const graded = homeworks.reduce((acc, hw) => acc + (hw.submissions?.filter(s => s.status === 'graded').length || 0), 0);
    res.json({ total, totalSubs, submitted, graded, submissionRate: totalSubs ? Math.round((submitted / totalSubs) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
