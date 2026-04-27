const router = require('express').Router();
const School = require('../models/School');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    res.json(school);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
