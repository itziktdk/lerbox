const router = require('express').Router();
const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Homework = require('../models/Homework');
const Behavior = require('../models/Behavior');
const Achievement = require('../models/Achievement');
const Attendance = require('../models/Attendance');

router.post('/seed', async (req, res) => {
  try {
    await Promise.all([
      School.deleteMany({}), Class.deleteMany({}), User.deleteMany({}),
      Announcement.deleteMany({}), Homework.deleteMany({}),
      Behavior.deleteMany({}), Achievement.deleteMany({}), Attendance.deleteMany({})
    ]);

    const school = await School.create({
      name: 'בית ספר הרצל', slug: 'herzl',
      address: 'רחוב הרצל 42, תל אביב', principal: 'מיכל ברק'
    });

    const teacher = await User.create({
      schoolId: school._id, name: 'רונית כהן', phone: '0501111111',
      role: 'teacher', avatar: '👩‍🏫'
    });

    const cls = await Class.create({
      schoolId: school._id, name: 'כיתה ו\'1', grade: 'ו\'', year: 2026, teacherId: teacher._id
    });
    teacher.classId = cls._id;
    await teacher.save();

    const studentData = [
      { name: 'דניאל לוי', avatar: '👦', points: 320, streaks: { attendance: 12, homework: 7, bestAttendance: 15 } },
      { name: 'נועה גולן', avatar: '👧', points: 450, streaks: { attendance: 14, homework: 9, bestAttendance: 14 } },
      { name: 'יובל מזרחי', avatar: '🧑', points: 180, streaks: { attendance: 5, homework: 3, bestAttendance: 8 } },
      { name: 'שירה אביב', avatar: '👧🏻', points: 500, streaks: { attendance: 15, homework: 10, bestAttendance: 15 } },
      { name: 'עומר דוד', avatar: '🧒', points: 95, streaks: { attendance: 2, homework: 1, bestAttendance: 4 } },
      { name: 'מיה כהן', avatar: '👩🏻', points: 280, streaks: { attendance: 10, homework: 6, bestAttendance: 12 } },
      { name: 'איתן פרץ', avatar: '👨🏻', points: 150, streaks: { attendance: 7, homework: 4, bestAttendance: 9 } },
      { name: 'תמר רוזן', avatar: '👧🏽', points: 390, streaks: { attendance: 11, homework: 8, bestAttendance: 13 } },
      { name: 'אורי שמיר', avatar: '🧑🏻', points: 50, streaks: { attendance: 0, homework: 0, bestAttendance: 3 } },
      { name: 'הילה ברק', avatar: '👩', points: 420, streaks: { attendance: 13, homework: 9, bestAttendance: 13 } }
    ];

    const studentPhones = [
      '0531111101','0531111102','0531111103','0531111104','0531111105',
      '0531111106','0531111107','0531111108','0531111109','0531111110'
    ];

    const students = [];
    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      const student = await User.create({
        schoolId: school._id, classId: cls._id, role: 'student',
        phone: studentPhones[i], ...s,
        badges: s.points >= 300 ? [
          { name: 'מצטיין', icon: '⭐', earnedAt: new Date() },
          { name: 'אלוף', icon: '🏆', earnedAt: new Date() }
        ] : s.points >= 100 ? [
          { name: 'מצטיין', icon: '⭐', earnedAt: new Date() }
        ] : []
      });
      students.push(student);
    }

    // Parents - one per student
    const parents = [];
    const parentNames = [
      'יעל לוי','רחל גולן','אבי מזרחי','דינה אביב','משה דוד',
      'ענת כהן','שרה פרץ','חנה רוזן','דוד שמיר','רינה ברק'
    ];
    for (let i = 0; i < 10; i++) {
      const p = await User.create({
        schoolId: school._id, name: parentNames[i],
        phone: '050222220' + (i + 1).toString().padStart(1, '0'),
        role: 'parent', parentOf: [students[i]._id], classId: cls._id, avatar: '👨‍👩‍👦'
      });
      parents.push(p);
    }
    // Fix phone for 0502222210
    parents[9].phone = '0502222210';
    await parents[9].save();

    const admin = await User.create({
      schoolId: school._id, name: 'מיכל ברק', phone: '0509999999',
      role: 'admin', avatar: '👩‍💼'
    });

    // Attendance - last 5 days
    for (let d = 0; d < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d - 1);
      date.setHours(8, 0, 0, 0);
      const statuses = ['present', 'present', 'present', 'present', 'late', 'present', 'present', 'absent', 'present', 'present'];
      // Rotate pattern
      await Attendance.create({
        classId: cls._id, date, period: 1, teacherId: teacher._id,
        records: students.map((s, i) => ({
          studentId: s._id,
          status: statuses[(i + d) % statuses.length]
        }))
      });
    }

    // Behavior records - last 5 days
    const behaviorRecords = [
      { studentId: students[0]._id, type: 'positive', note: 'עזרה לחבר במתמטיקה', points: 5 },
      { studentId: students[1]._id, type: 'positive', note: 'הצגה מעולה בעברית', points: 5 },
      { studentId: students[3]._id, type: 'positive', note: 'השתתפות פעילה בשיעור', points: 3 },
      { studentId: students[4]._id, type: 'disruption', note: 'הפרעה בשיעור מדעים', points: -3 },
      { studentId: students[8]._id, type: 'disruption', note: 'איחור חוזר', points: -2 },
      { studentId: students[7]._id, type: 'positive', note: 'ציון מעולה במבחן', points: 5 },
      { studentId: students[9]._id, type: 'positive', note: 'מנהיגות בפעילות חברתית', points: 5 },
      { studentId: students[2]._id, type: 'positive', note: 'שיפור משמעותי בהתנהגות', points: 3 },
    ];
    for (const b of behaviorRecords) {
      await Behavior.create({ ...b, classId: cls._id, teacherId: teacher._id });
    }

    // Homework - 3 active assignments
    const homeworks = [
      { title: 'תרגילים בשברים', description: 'עמוד 45, תרגילים 1-10', dueDate: new Date(Date.now() + 3*86400000) },
      { title: 'חיבור בנושא "הגיבור שלי"', description: 'כתבו חיבור של לפחות עמוד אחד', dueDate: new Date(Date.now() + 5*86400000) },
      { title: 'מפת ישראל - ערים ונהרות', description: 'סמנו 10 ערים ו-3 נהרות על המפה', dueDate: new Date(Date.now() + 2*86400000) },
    ];
    for (const hw of homeworks) {
      await Homework.create({
        classId: cls._id, teacherId: teacher._id, ...hw,
        submissions: students.map((s, i) => ({
          studentId: s._id,
          status: i < 5 ? 'submitted' : 'pending',
          submittedAt: i < 5 ? new Date() : undefined
        }))
      });
    }

    // Announcements
    await Announcement.create([
      { schoolId: school._id, title: 'טיול שנתי לגליל 🏔️', body: 'הטיול השנתי יתקיים ביום שלישי 5.5. נא לוודא אישורי הורים עד יום ראשון.', authorId: admin._id, authorRole: 'admin', audience: 'all' },
      { schoolId: school._id, title: 'יום ספורט 🏃', body: 'יום ספורט בית ספרי יתקיים ביום חמישי. יש להגיע עם ביגוד ספורטיבי.', authorId: admin._id, authorRole: 'admin', audience: 'all' },
      { schoolId: school._id, classId: cls._id, title: 'מבחן מתמטיקה 📐', body: 'מבחן בשברים ואחוזים ביום רביעי. חומר ללמידה הועלה לתיקייה.', authorId: teacher._id, authorRole: 'teacher', audience: 'class' }
    ]);

    // Achievements
    const achData = [
      { studentId: students[3]._id, type: 'streak_attendance_15', name: '15 ימי נוכחות רצופים', icon: '🏆' },
      { studentId: students[3]._id, type: 'points_500', name: '500 נקודות!', icon: '💎' },
      { studentId: students[1]._id, type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: '⭐' },
      { studentId: students[1]._id, type: 'points_400', name: '400 נקודות', icon: '💯' },
      { studentId: students[9]._id, type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: '⭐' },
      { studentId: students[9]._id, type: 'points_400', name: '400 נקודות', icon: '💯' },
      { studentId: students[0]._id, type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: '⭐' },
      { studentId: students[0]._id, type: 'points_300', name: '300 נקודות', icon: '💎' },
      { studentId: students[7]._id, type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: '⭐' },
      { studentId: students[7]._id, type: 'points_300', name: '300 נקודות', icon: '💎' },
      { studentId: students[5]._id, type: 'points_200', name: '200 נקודות', icon: '🌟' },
    ];
    await Achievement.create(achData);

    res.json({
      success: true,
      message: 'Demo data seeded! בית ספר הרצל ready.',
      logins: {
        teacher: { phone: '0501111111', name: 'רונית כהן' },
        student: { phone: studentPhones[0], name: 'דניאל לוי' },
        parent: { phone: '0502222201', name: 'יעל לוי' },
        admin: { phone: '0509999999', name: 'מיכל ברק' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
