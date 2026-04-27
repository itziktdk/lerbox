const router = require('express').Router();
const Behavior = require('../models/Behavior');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get behavior records with filters
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.date) {
      const d = new Date(req.query.date);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lt: end };
    }
    if (req.query.type) filter.type = req.query.type;
    const records = await Behavior.find(filter)
      .populate('studentId', 'name avatar')
      .populate('teacherId', 'name')
      .sort('-date')
      .limit(200);
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get stats for a class (today or by date)
router.get('/stats', auth, async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId) return res.status(400).json({ error: 'classId נדרש' });
    const d = date ? new Date(date) : new Date();
    const start = new Date(d); start.setHours(0,0,0,0);
    const end = new Date(d); end.setHours(23,59,59,999);

    const records = await Behavior.find({ classId, date: { $gte: start, $lt: end } });
    const positive = records.filter(r => r.type === 'positive').length;
    const disruption = records.filter(r => r.type === 'disruption').length;
    const lateness = records.filter(r => r.type === 'lateness').length;
    const totalPoints = records.reduce((sum, r) => sum + (r.points || 0), 0);

    res.json({ positive, disruption, lateness, total: records.length, totalPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create behavior report
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { studentId, classId, type, note, period } = req.body;
    if (!studentId || !classId || !type) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }
    const points = type === 'positive' ? 5 : type === 'disruption' ? -3 : -1;
    const behavior = new Behavior({
      studentId, classId, type, note,
      period: period || undefined,
      teacherId: req.user._id,
      points,
      date: new Date()
    });
    await behavior.save();
    await User.findByIdAndUpdate(studentId, { $inc: { points } });
    const populated = await behavior.populate('studentId', 'name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete behavior report (teacher/admin only, own reports or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await Behavior.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'דיווח לא נמצא' });
    if (req.user.role !== 'admin' && String(record.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'אין הרשאה למחוק דיווח זה' });
    }
    // Reverse points
    await User.findByIdAndUpdate(record.studentId, { $inc: { points: -(record.points || 0) } });
    await Behavior.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
