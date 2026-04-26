const router = require('express').Router();
const Homework = require('../models/Homework');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  const hw = await Homework.find(filter).populate('teacherId', 'name').sort('-dueDate');
  res.json(hw);
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

module.exports = router;
