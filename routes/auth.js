const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Send OTP (demo: returns code directly)
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    let user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'מספר טלפון לא רשום במערכת' });
    user.otpCode = code;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    // In production: send SMS. For demo, return code.
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const user = await User.findOne({ phone, otpCode: code }).populate('classId');
    if (!user || user.otpExpires < new Date()) {
      return res.status(401).json({ error: 'קוד שגוי או שפג תוקפו' });
    }
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, name: user.name, role: user.role, phone: user.phone, classId: user.classId, schoolId: user.schoolId, points: user.points, streaks: user.streaks, badges: user.badges, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo login (skip OTP)
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOne({ role }).populate('classId');
    if (!user) return res.status(404).json({ error: 'אין משתמש דמו לתפקיד זה' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, name: user.name, role: user.role, phone: user.phone, classId: user.classId, schoolId: user.schoolId, points: user.points, streaks: user.streaks, badges: user.badges, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
