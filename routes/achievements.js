const router = require('express').Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Behavior = require('../models/Behavior');
const auth = require('../middleware/auth');

const ACHIEVEMENT_DEFS = [
  { type: 'streak_attendance_5', name: '5 ימי נוכחות רצופים', icon: '🔥', description: 'הגעת 5 ימים רצוף!', category: 'נוכחות' },
  { type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: '⭐', description: 'כוכב נוכחות!', category: 'נוכחות' },
  { type: 'streak_attendance_20', name: '20 ימי נוכחות רצופים', icon: '🏆', description: 'אלוף/ת הנוכחות!', category: 'נוכחות' },
  { type: 'streak_attendance_30', name: 'חודש מלא!', icon: '👑', description: '30 ימים רצופים!', category: 'נוכחות' },
  { type: 'streak_homework_3', name: '3 הגשות רצופות', icon: '📝', description: 'מתמיד/ה!', category: 'שיעורי בית' },
  { type: 'streak_homework_7', name: '7 הגשות רצופות', icon: '📚', description: 'חרוץ/ה!', category: 'שיעורי בית' },
  { type: 'streak_homework_15', name: '15 הגשות רצופות', icon: '🎓', description: 'מדהים!', category: 'שיעורי בית' },
  { type: 'points_50', name: '50 נקודות', icon: '💎', description: 'צוברים כוח!', category: 'נקודות' },
  { type: 'points_100', name: '100 נקודות', icon: '💯', description: 'מאה אחוז!', category: 'נקודות' },
  { type: 'points_200', name: '200 נקודות', icon: '🌟', description: 'סופרסטאר!', category: 'נקודות' },
  { type: 'behavior_positive_5', name: '5 דיווחים חיוביים', icon: '😊', description: 'תלמיד/ה לדוגמה!', category: 'התנהגות' },
  { type: 'behavior_positive_10', name: '10 דיווחים חיוביים', icon: '🌈', description: 'מקור השראה!', category: 'התנהגות' },
];

router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;
    else if (req.user.role === 'student') filter.studentId = req.user._id;
    const items = await Achievement.find(filter).sort('-earnedAt');
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/catalog', auth, async (req, res) => {
  try {
    const studentId = req.query.studentId || (req.user.role === 'student' ? req.user._id : null);
    if (!studentId) return res.json(ACHIEVEMENT_DEFS.map(d => ({ ...d, unlocked: false })));
    const earned = await Achievement.find({ studentId }).select('type');
    const earnedTypes = new Set(earned.map(a => a.type));
    res.json(ACHIEVEMENT_DEFS.map(d => ({ ...d, unlocked: earnedTypes.has(d.type) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/student-stats', auth, async (req, res) => {
  const studentId = req.query.studentId || (req.user.role === 'student' ? req.user._id : null);
  if (!studentId) return res.status(400).json({ error: 'Missing studentId' });
  try {
    const [user, achievements, positiveBehaviors] = await Promise.all([
      User.findById(studentId).select('name points streaks badges avatar classId'),
      Achievement.countDocuments({ studentId }),
      Behavior.countDocuments({ studentId, type: 'positive' })
    ]);
    if (!user) return res.status(404).json({ error: 'Student not found' });

    const points = user.points || 0;
    const level = Math.floor(points / 30) + 1;
    const pointsInLevel = points % 30;
    const pointsToNext = 30;
    const levelProgress = Math.round((pointsInLevel / pointsToNext) * 100);
    const levelTitles = ['מתחיל', 'חרוץ', 'מצטיין', 'כוכב', 'אלוף', 'אגדה', 'מאסטר', 'גאון'];
    const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    let rank = 1, classSize = 1;
    if (user.classId) {
      const classmates = await User.find({ classId: user.classId, role: 'student' }).select('points').sort('-points');
      classSize = classmates.length;
      rank = classmates.findIndex(s => s._id.toString() === studentId.toString()) + 1;
    }

    const challenges = [
      { id: 'attend', title: 'הגיעו לכל השיעורים היום', icon: 'check', reward: 5, done: (user.streaks?.attendance || 0) > 0 },
      { id: 'homework', title: 'הגישו שיעורי בית', icon: 'book', reward: 3, done: false },
      { id: 'positive', title: 'קבלו דיווח חיובי', icon: 'sparkles', reward: 5, done: positiveBehaviors > 0 }
    ];

    res.json({ points, level, levelTitle, levelProgress, pointsInLevel, pointsToNext,
      streaks: user.streaks || {}, achievementCount: achievements, totalAchievements: ACHIEVEMENT_DEFS.length,
      positiveBehaviors, rank, classSize, challenges, avatar: user.avatar, name: user.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
