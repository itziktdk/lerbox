const router = require('express').Router();
const Behavior = require('../models/Behavior');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.query.classId) filter.classId = req.query.classId;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.date) {
    const d = new Date(req.query.date);
    filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
  }
  const records = await Behavior.find(filter).populate('studentId', 'name avatar').sort('-date').limit(100);
  res.json(records);
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { studentId, classId, type, note, period } = req.body;
    const points = type === 'positive' ? 5 : type === 'disruption' ? -3 : -1;
    const behavior = new Behavior({ studentId, classId, type, note, period, teacherId: req.user._id, points, date: new Date() });
    await behavior.save();
    await User.findByIdAndUpdate(studentId, { $inc: { points } });
    res.json(behavior);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
