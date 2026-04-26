const router = require('express').Router();
const User = require('../models/User');
const Class = require('../models/Class');
const School = require('../models/School');
const Attendance = require('../models/Attendance');
const Behavior = require('../models/Behavior');
const auth = require('../middleware/auth');

// Middleware: admin only
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'גישה למנהלים בלבד' });
  next();
}

// GET /api/admin/dashboard — school-wide stats
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const [classes, teachers, students, parents] = await Promise.all([
      Class.find({ schoolId }).populate('teacherId', 'name avatar'),
      User.find({ schoolId, role: 'teacher' }).select('name avatar classId'),
      User.find({ schoolId, role: 'student' }).select('name avatar classId points streaks badges'),
      User.find({ schoolId, role: 'parent' }).select('name avatar parentOf')
    ]);

    // Attendance stats for today across all classes
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecords = await Attendance.find({
      classId: { $in: classes.map(c => c._id) },
      date: today
    });

    let totalPresent = 0, totalLate = 0, totalAbsent = 0, totalRecords = 0;
    attendanceRecords.forEach(rec => {
      rec.records.forEach(r => {
        totalRecords++;
        if (r.status === 'present') totalPresent++;
        else if (r.status === 'late') totalLate++;
        else if (r.status === 'absent') totalAbsent++;
      });
    });

    // Behavior stats for today
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const behaviorToday = await Behavior.find({
      classId: { $in: classes.map(c => c._id) },
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    const positiveBehavior = behaviorToday.filter(b => b.points > 0).length;
    const negativeBehavior = behaviorToday.filter(b => b.points < 0).length;

    // Per-class stats
    const classStats = await Promise.all(classes.map(async (cls) => {
      const classStudents = students.filter(s => String(s.classId) === String(cls._id));
      const classAttendance = attendanceRecords.find(a => String(a.classId) === String(cls._id));
      let present = 0, late = 0, absent = 0;
      if (classAttendance) {
        classAttendance.records.forEach(r => {
          if (r.status === 'present') present++;
          else if (r.status === 'late') late++;
          else if (r.status === 'absent') absent++;
        });
      }
      const total = present + late + absent;
      return {
        _id: cls._id,
        name: cls.name,
        grade: cls.grade,
        teacher: cls.teacherId,
        studentCount: classStudents.length,
        attendance: { present, late, absent, rate: total ? Math.round((present / total) * 100) : 0 },
        avgPoints: classStudents.length ? Math.round(classStudents.reduce((sum, s) => sum + s.points, 0) / classStudents.length) : 0
      };
    }));

    // Top students
    const topStudents = [...students].sort((a, b) => b.points - a.points).slice(0, 10);

    res.json({
      school: { classCount: classes.length, teacherCount: teachers.length, studentCount: students.length, parentCount: parents.length },
      attendance: {
        present: totalPresent, late: totalLate, absent: totalAbsent,
        rate: totalRecords ? Math.round((totalPresent / totalRecords) * 100) : 0
      },
      behavior: { positive: positiveBehavior, negative: negativeBehavior },
      classStats,
      topStudents: topStudents.map(s => ({ _id: s._id, name: s.name, avatar: s.avatar, points: s.points, classId: s.classId }))
    });
  } catch (e) {
    console.error('Admin dashboard error:', e);
    res.status(500).json({ error: 'שגיאה בטעינת הדשבורד' });
  }
});

// GET /api/admin/classes — all classes with details
router.get('/classes', auth, adminOnly, async (req, res) => {
  const schoolId = req.user.schoolId;
  const classes = await Class.find({ schoolId }).populate('teacherId', 'name avatar');
  const result = await Promise.all(classes.map(async (cls) => {
    const studentCount = await User.countDocuments({ classId: cls._id, role: 'student' });
    return { ...cls.toObject(), studentCount };
  }));
  res.json(result);
});

// POST /api/admin/classes — create class
router.post('/classes', auth, adminOnly, async (req, res) => {
  const cls = await Class.create({ ...req.body, schoolId: req.user.schoolId });
  res.json(cls);
});

// PUT /api/admin/classes/:id — update class
router.put('/classes/:id', auth, adminOnly, async (req, res) => {
  const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cls);
});

// DELETE /api/admin/classes/:id — delete class
router.delete('/classes/:id', auth, adminOnly, async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/users — all users with filters
router.get('/users', auth, adminOnly, async (req, res) => {
  const filter = { schoolId: req.user.schoolId };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.classId) filter.classId = req.query.classId;
  const users = await User.find(filter).select('-otpCode -otpExpires -password').populate('classId', 'name').sort('name');
  res.json(users);
});

// POST /api/admin/users — create user
router.post('/users', auth, adminOnly, async (req, res) => {
  const user = await User.create({ ...req.body, schoolId: req.user.schoolId });
  res.json(user);
});

// PUT /api/admin/users/:id — update user
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-otpCode -otpExpires -password');
  res.json(user);
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// GET /api/admin/school — school settings
router.get('/school', auth, adminOnly, async (req, res) => {
  const school = await School.findById(req.user.schoolId);
  res.json(school);
});

// PUT /api/admin/school — update school settings
router.put('/school', auth, adminOnly, async (req, res) => {
  const school = await School.findByIdAndUpdate(req.user.schoolId, req.body, { new: true });
  res.json(school);
});

module.exports = router;
