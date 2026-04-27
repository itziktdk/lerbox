const router = require('express').Router();
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
    if (req.user.role === 'teacher') filter.teacherId = req.user._id;
    const classes = await Class.find(filter).populate('teacherId', 'name');
    res.json(classes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate('teacherId', 'name');
    res.json(cls);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/students', auth, async (req, res) => {
  try {
    const students = await User.find({ classId: req.params.id, role: 'student' }).sort('name');
    res.json(students);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/parents', auth, async (req, res) => {
  try {
    const parents = await User.find({ classId: req.params.id, role: 'parent' }).sort('name');
    res.json(parents);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
