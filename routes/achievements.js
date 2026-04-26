const router = require('express').Router();
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.query.studentId) filter.studentId = req.query.studentId;
  else if (req.user.role === 'student') filter.studentId = req.user._id;
  const items = await Achievement.find(filter).sort('-earnedAt');
  res.json(items);
});

module.exports = router;
