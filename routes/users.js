const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = { schoolId: req.user.schoolId };
    if (req.query.role) filter.role = req.query.role;
    if (req.query.classId) filter.classId = req.query.classId;
    const users = await User.find(filter).select('-otpCode -otpExpires').sort('name');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-otpCode -otpExpires');
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Leaderboard
router.get('/leaderboard/class/:classId', auth, async (req, res) => {
  try {
    const students = await User.find({ classId: req.params.classId, role: 'student' })
      .select('name points streaks badges avatar')
      .sort('-points')
      .limit(20);
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
