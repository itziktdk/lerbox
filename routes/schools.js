const router = require('express').Router();
const School = require('../models/School');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const schools = await School.find();
  res.json(schools);
});

router.get('/:id', auth, async (req, res) => {
  const school = await School.findById(req.params.id);
  res.json(school);
});

module.exports = router;
