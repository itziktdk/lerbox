const router = require('express').Router();
const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Homework = require('../models/Homework');
const Behavior = require('../models/Behavior');
const Achievement = require('../models/Achievement');

router.post('/seed', async (req, res) => {
  try {
    // Clear existing demo data
    await Promise.all([
      School.deleteMany({}), Class.deleteMany({}), User.deleteMany({}),
      Announcement.deleteMany({}), Homework.deleteMany({}),
      Behavior.deleteMany({}), Achievement.deleteMany({})
    ]);

    // Create school
    const school = await School.create({
      name: 'בית ספר השלום',
      slug: 'hashalom',
      address: 'רחוב הרצל 15, תל אביב',
      principal: 'דנה כהן'
    });

    // Create teacher
    const teacher = await User.create({
      schoolId: school._id, name: 'מיכל לוי', phone: '0501234567',
      email: 'michal@lerbox.io', role: 'teacher', avatar: '👩‍🏫'
    });

    // Create class
    const cls = await Class.create({
      schoolId: school._id, name: 'ו\'2', grade: 'ו\'', year: 2026, teacherId: teacher._id
    });
    teacher.classId = cls._id;
    await teacher.save();

    // Create students
    const studentNames = [
      { name: 'נועם אברהם', avatar: '🧑', points: 85, streaks: { attendance: 12, homework: 5, bestAttendance: 15 } },
      { name: 'מאיה דוד', avatar: '👧', points: 120, streaks: { attendance: 20, homework: 8, bestAttendance: 20 } },
      { name: 'איתן כהן', avatar: '👦', points: 65, streaks: { attendance: 3, homework: 2, bestAttendance: 7 } },
      { name: 'שירה גולן', avatar: '👧🏻', points: 95, streaks: { attendance: 8, homework: 6, bestAttendance: 10 } },
      { name: 'עומר פרץ', avatar: '🧒', points: 45, streaks: { attendance: 1, homework: 1, bestAttendance: 4 } },
      { name: 'נויה שמיר', avatar: '👩🏻', points: 110, streaks: { attendance: 15, homework: 7, bestAttendance: 15 } },
      { name: 'דניאל רוזן', avatar: '👨🏻', points: 72, streaks: { attendance: 5, homework: 3, bestAttendance: 9 } },
      { name: 'תמר אלון', avatar: '👧🏽', points: 88, streaks: { attendance: 10, homework: 4, bestAttendance: 12 } },
      { name: 'יובל ברק', avatar: '🧑🏻', points: 55, streaks: { attendance: 2, homework: 2, bestAttendance: 6 } },
      { name: 'אלה מזרחי', avatar: '👩', points: 130, streaks: { attendance: 25, homework: 10, bestAttendance: 25 } }
    ];

    const students = [];
    for (const s of studentNames) {
      const student = await User.create({
        schoolId: school._id, classId: cls._id, role: 'student',
        phone: '05' + Math.floor(10000000 + Math.random() * 90000000),
        ...s,
        badges: s.points > 100 ? [{ name: 'מצטיין', icon: '⭐', earnedAt: new Date() }] : []
      });
      students.push(student);
    }

    // Create parent (linked to first student)
    const parent = await User.create({
      schoolId: school._id, name: 'רונית אברהם', phone: '0521234567',
      role: 'parent', parentOf: [students[0]._id], classId: cls._id, avatar: '👩‍👦'
    });

    // Create admin
    const admin = await User.create({
      schoolId: school._id, name: 'דנה כהן', phone: '0531234567',
      role: 'admin', avatar: '👩‍💼'
    });

    // Create announcements
    await Announcement.create([
      { schoolId: school._id, title: 'טיול שנתי 🏔️', body: 'הטיול השנתי יתקיים ביום שלישי הקרוב. נא לוודא אישורי הורים.', authorId: admin._id, authorRole: 'admin', audience: 'all' },
      { schoolId: school._id, classId: cls._id, title: 'מבחן מתמטיקה', body: 'מבחן בשברים ביום חמישי. חומר ללמידה הועלה לתיקייה.', authorId: teacher._id, authorRole: 'teacher', audience: 'class' }
    ]);

    // Create homework
    const hw = await Homework.create({
      classId: cls._id, title: 'תרגילים בשברים', description: 'עמוד 45, תרגילים 1-10',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), teacherId: teacher._id,
      submissions: students.map(s => ({ studentId: s._id, status: Math.random() > 0.5 ? 'submitted' : 'pending', submittedAt: Math.random() > 0.5 ? new Date() : undefined }))
    });

    // Create some behavior records
    await Behavior.create([
      { studentId: students[1]._id, classId: cls._id, type: 'positive', note: 'עזרה לחבר בשיעור', teacherId: teacher._id, points: 5 },
      { studentId: students[9]._id, classId: cls._id, type: 'positive', note: 'הצגה מעולה בפני הכיתה', teacherId: teacher._id, points: 5 },
      { studentId: students[4]._id, classId: cls._id, type: 'disruption', note: 'הפרעה בשיעור', teacherId: teacher._id, points: -3 }
    ]);

    // Create achievements
    await Achievement.create([
      { studentId: students[9]._id, type: 'streak', name: 'שריפה! 🔥 25 ימי נוכחות', icon: '🔥' },
      { studentId: students[1]._id, type: 'streak', name: 'כוכב 20 ימי נוכחות', icon: '⭐' },
      { studentId: students[9]._id, type: 'points', name: 'מאה נקודות!', icon: '💯' },
      { studentId: students[1]._id, type: 'points', name: 'מאה נקודות!', icon: '💯' },
      { studentId: students[5]._id, type: 'points', name: 'מאה נקודות!', icon: '💯' }
    ]);

    res.json({
      success: true,
      message: 'Demo data created!',
      logins: {
        teacher: { phone: teacher.phone, name: teacher.name },
        student: { phone: students[0].phone, name: students[0].name },
        parent: { phone: parent.phone, name: parent.name },
        admin: { phone: admin.phone, name: admin.name }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
