const router = require('express').Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const filter = { schoolId: req.user.schoolId };
  if (req.query.classId) {
    filter.$or = [{ classId: req.query.classId }, { classId: null }];
  }
  const items = await Announcement.find(filter).populate('authorId', 'name role').sort('-createdAt').limit(50);
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    const { title, body, classId, audience } = req.body;
    const item = new Announcement({ schoolId: req.user.schoolId, classId: classId || null, title, body, authorId: req.user._id, authorRole: req.user.role, audience: audience || 'all' });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
