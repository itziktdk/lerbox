const router = require('express').Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get attendance for class/date/period
router.get('/', auth, async (req, res) => {
  const { classId, date, period } = req.query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
  }
  if (period) filter.period = parseInt(period);
  const records = await Attendance.find(filter).populate('records.studentId', 'name avatar').sort('-date');
  res.json(records);
});

// Save attendance
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { classId, date, period, records } = req.body;
    const d = new Date(date);
    d.setHours(0,0,0,0);

    let attendance = await Attendance.findOne({ classId, date: d, period });
    if (attendance) {
      attendance.records = records;
      attendance.teacherId = req.user._id;
    } else {
      attendance = new Attendance({ classId, date: d, period, records, teacherId: req.user._id });
    }
    await attendance.save();

    // Update student streaks
    for (const rec of records) {
      if (rec.status === 'present') {
        await User.findByIdAndUpdate(rec.studentId, {
          $inc: { 'streaks.attendance': 1, points: 2 }
        });
      } else if (rec.status === 'late') {
        // Late: keep streak but award 1 point instead of 2
        await User.findByIdAndUpdate(rec.studentId, {
          $inc: { points: 1 }
        });
      } else if (rec.status === 'absent') {
        await User.findByIdAndUpdate(rec.studentId, {
          $set: { 'streaks.attendance': 0 }
        });
      }
    }

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance stats for class
router.get('/stats/:classId', auth, async (req, res) => {
  const records = await Attendance.find({ classId: req.params.classId });
  let total = 0, present = 0, late = 0, absent = 0;
  records.forEach(r => {
    r.records.forEach(s => {
      total++;
      if (s.status === 'present') present++;
      else if (s.status === 'late') late++;
      else absent++;
    });
  });
  res.json({ total, present, late, absent, rate: total ? Math.round((present / total) * 100) : 0 });
});

module.exports = router;
