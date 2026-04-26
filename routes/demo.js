const router = require('express').Router();
const mongoose = require('mongoose');
const School = require('../models/School');
const Class = require('../models/Class');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Homework = require('../models/Homework');
const Behavior = require('../models/Behavior');
const Achievement = require('../models/Achievement');
const Attendance = require('../models/Attendance');
const Message = require('../models/Message');

router.post('/seed', async (req, res) => {
  try {
    await Promise.all([
      School.deleteMany({}), Class.deleteMany({}), User.deleteMany({}),
      Announcement.deleteMany({}), Homework.deleteMany({}),
      Behavior.deleteMany({}), Achievement.deleteMany({}),
      Attendance.deleteMany({}), Message.deleteMany({})
    ]);

    const school = await School.create({
      name: 'בית ספר הרצל', slug: 'herzl',
      address: 'רחוב הרצל 42, תל אביב', principal: 'מיכל ברק'
    });

    // ===== TEACHER =====
    const teacher = await User.create({
      schoolId: school._id, name: 'רונית כהן', phone: '0501111111',
      role: 'teacher'
    });

    const cls = await Class.create({
      schoolId: school._id, name: "כיתה ו'1", grade: "ו'", year: 2026, teacherId: teacher._id
    });
    teacher.classId = cls._id;
    await teacher.save();

    // ===== 15 STUDENTS =====
    const studentData = [
      { name: 'דניאל לוי', phone: '0501111112', points: 320, streaks: { attendance: 5, homework: 7, bestAttendance: 15 } },
      { name: 'נועה גולן', phone: '0531111102', points: 450, streaks: { attendance: 14, homework: 9, bestAttendance: 14 } },
      { name: 'יובל מזרחי', phone: '0531111103', points: 180, streaks: { attendance: 5, homework: 3, bestAttendance: 8 } },
      { name: 'שירה אביב', phone: '0531111104', points: 500, streaks: { attendance: 15, homework: 10, bestAttendance: 15 } },
      { name: 'עומר דוד', phone: '0531111105', points: 95, streaks: { attendance: 2, homework: 1, bestAttendance: 4 } },
      { name: 'מיה כהן', phone: '0531111106', points: 280, streaks: { attendance: 10, homework: 6, bestAttendance: 12 } },
      { name: 'איתן פרץ', phone: '0531111107', points: 150, streaks: { attendance: 7, homework: 4, bestAttendance: 9 } },
      { name: 'תמר רוזן', phone: '0531111108', points: 390, streaks: { attendance: 11, homework: 8, bestAttendance: 13 } },
      { name: 'אורי שמיר', phone: '0531111109', points: 50, streaks: { attendance: 0, homework: 0, bestAttendance: 3 } },
      { name: 'הילה ברק', phone: '0531111110', points: 420, streaks: { attendance: 13, homework: 9, bestAttendance: 13 } },
      { name: 'רועי אשכנזי', phone: '0531111111', points: 210, streaks: { attendance: 8, homework: 5, bestAttendance: 10 } },
      { name: 'ליאור חדד', phone: '0531111112', points: 340, streaks: { attendance: 12, homework: 7, bestAttendance: 12 } },
      { name: 'עדן סויסה', phone: '0531111113', points: 160, streaks: { attendance: 4, homework: 3, bestAttendance: 6 } },
      { name: 'אלה פישר', phone: '0531111114', points: 400, streaks: { attendance: 13, homework: 8, bestAttendance: 14 } },
      { name: 'נדב ישראלי', phone: '0531111115', points: 110, streaks: { attendance: 3, homework: 2, bestAttendance: 5 } }
    ];

    const students = [];
    for (const s of studentData) {
      const student = await User.create({
        schoolId: school._id, classId: cls._id, role: 'student',
        name: s.name, phone: s.phone, points: s.points, streaks: s.streaks,
        badges: s.points >= 300 ? [
          { name: 'מצטיין', icon: 'star', earnedAt: new Date() },
          { name: 'אלוף', icon: 'trophy', earnedAt: new Date() }
        ] : s.points >= 100 ? [
          { name: 'מצטיין', icon: 'star', earnedAt: new Date() }
        ] : []
      });
      students.push(student);
    }

    // ===== PARENTS (one per student) =====
    const parentNames = [
      'יעל לוי','רחל גולן','אבי מזרחי','דינה אביב','משה דוד',
      'ענת כהן','שרה פרץ','חנה רוזן','דוד שמיר','רינה ברק',
      'מירב אשכנזי','יוסי חדד','סיגל סויסה','אורלי פישר','גדי ישראלי'
    ];
    const parents = [];
    for (let i = 0; i < 15; i++) {
      const phone = i === 0 ? '0501111113' : `050222${(i + 1).toString().padStart(4, '0')}`;
      const p = await User.create({
        schoolId: school._id, name: parentNames[i],
        phone, role: 'parent', parentOf: [students[i]._id], classId: cls._id
      });
      parents.push(p);
    }

    // ===== ADMIN =====
    const admin = await User.create({
      schoolId: school._id, name: 'מיכל ברק', phone: '0501111114',
      role: 'admin'
    });

    // ===== ATTENDANCE — last 7 days =====
    const statuses = ['present','present','present','present','late','present','present','absent','present','present','present','present','late','present','present'];
    for (let d = 0; d < 7; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d - 1);
      date.setHours(8, 0, 0, 0);
      await Attendance.create({
        classId: cls._id, date, period: 1, teacherId: teacher._id,
        records: students.map((s, i) => ({
          studentId: s._id,
          status: statuses[(i + d) % statuses.length]
        }))
      });
    }

    // ===== BEHAVIOR =====
    const behaviorRecords = [
      { studentId: students[0]._id, type: 'positive', note: 'עזרה לחבר במתמטיקה', points: 5 },
      { studentId: students[0]._id, type: 'positive', note: 'השתתפות פעילה בשיעור מדעים', points: 3 },
      { studentId: students[1]._id, type: 'positive', note: 'הצגה מעולה בעברית', points: 5 },
      { studentId: students[3]._id, type: 'positive', note: 'עזרה לחברים בהכנה למבחן', points: 5 },
      { studentId: students[4]._id, type: 'disruption', note: 'הפרעה בשיעור מדעים', points: -3 },
      { studentId: students[8]._id, type: 'lateness', note: 'איחור חוזר', points: -2 },
      { studentId: students[7]._id, type: 'positive', note: 'ציון מעולה במבחן', points: 5 },
      { studentId: students[9]._id, type: 'positive', note: 'מנהיגות בפעילות חברתית', points: 5 },
      { studentId: students[2]._id, type: 'positive', note: 'שיפור משמעותי בהתנהגות', points: 3 },
      { studentId: students[14]._id, type: 'disruption', note: 'שיחה בשיעור', points: -2 },
      { studentId: students[5]._id, type: 'positive', note: 'עזרה לחברים בספרייה', points: 3 },
      { studentId: students[10]._id, type: 'lateness', note: 'איחור לשיעור ראשון', points: -2 },
    ];
    for (const b of behaviorRecords) {
      await Behavior.create({ ...b, classId: cls._id, teacherId: teacher._id });
    }

    // ===== 5 HOMEWORK ASSIGNMENTS =====
    const homeworkDefs = [
      { title: 'תרגילים בשברים', description: 'עמוד 45, תרגילים 1-10', dueDate: new Date(Date.now() + 3*86400000) },
      { title: 'ניסוי מדעי — צפיפות', description: 'בצעו את הניסוי ומלאו את דף העבודה', dueDate: new Date(Date.now() + 5*86400000) },
      { title: 'חיבור באנגלית — My Hero', description: 'Write a composition of at least 100 words about your hero', dueDate: new Date(Date.now() + 4*86400000) },
      { title: 'סיכום פרק בהיסטוריה', description: 'סכמו את פרק 5 — תקופת בית שני', dueDate: new Date(Date.now() + 2*86400000) },
      { title: 'קריאת ספר — דוח קריאה', description: 'קראו 3 פרקים וכתבו דוח קריאה עם סיכום ודעה אישית', dueDate: new Date(Date.now() + 7*86400000) }
    ];
    for (const hw of homeworkDefs) {
      await Homework.create({
        classId: cls._id, teacherId: teacher._id, ...hw,
        submissions: students.map((s, i) => ({
          studentId: s._id,
          status: i < 8 ? 'submitted' : 'pending',
          submittedAt: i < 8 ? new Date(Date.now() - (i+1)*3600000) : undefined
        }))
      });
    }

    // ===== 5 ANNOUNCEMENTS =====
    const now = Date.now();
    await Announcement.create([
      { schoolId: school._id, title: 'טיול שנתי לגליל', body: 'הטיול השנתי של שכבה ו\' יתקיים ביום שלישי 5.5. נא לוודא אישורי הורים חתומים עד יום ראשון. לא לשכוח: כובע, מים, ארוחה ארוזה.', authorId: admin._id, authorRole: 'admin', audience: 'all', createdAt: new Date(now - 1*86400000) },
      { schoolId: school._id, title: 'חופשת שבועות', body: 'בית הספר יהיה סגור מיום שני 2.6 עד יום חמישי 5.6. הלימודים חוזרים ביום ראשון 8.6.', authorId: admin._id, authorRole: 'admin', audience: 'all', createdAt: new Date(now - 2*86400000) },
      { schoolId: school._id, title: 'אסיפת הורים — כיתות ו\'', body: 'אסיפת הורים תתקיים ביום רביעי 14.5 בשעה 18:00 בחדר מורים. נושא מרכזי: הכנה לחטיבת הביניים.', authorId: admin._id, authorRole: 'admin', audience: 'all', createdAt: new Date(now - 3*86400000) },
      { schoolId: school._id, classId: cls._id, title: 'מבחן מתמטיקה — שברים ואחוזים', body: 'מבחן ביום רביעי הקרוב. החומר: פרקים 4-6 בספר. חזרו על תרגילים בעמודים 40-55.', authorId: teacher._id, authorRole: 'teacher', audience: 'class', createdAt: new Date(now - 1*86400000) },
      { schoolId: school._id, title: 'יום ספורט בית ספרי', body: 'יום ספורט יתקיים ביום חמישי 8.5. יש להגיע עם ביגוד ספורטיבי ונעלי ספורט. תחרויות ריצה, כדורגל וכדורסל.', authorId: admin._id, authorRole: 'admin', audience: 'all', createdAt: new Date(now - 4*86400000) }
    ]);

    // ===== MESSAGES — Teacher ↔ Parent (Yael) =====
    const msgs = [
      { fromId: parents[0]._id, toId: teacher._id, body: 'שלום רונית, רציתי לשאול איך דניאל מסתדר בכיתה השבוע?', read: true, createdAt: new Date(now - 2*86400000) },
      { fromId: teacher._id, toId: parents[0]._id, body: 'שלום יעל! דניאל מסתדר מצוין. הוא מאוד פעיל בשיעורים והיום אפילו עזר לחבר במתמטיקה. גאה בו!', read: true, createdAt: new Date(now - 2*86400000 + 3600000) },
      { fromId: parents[0]._id, toId: teacher._id, body: 'שמחה לשמוע! יש משהו שצריך לשפר?', read: true, createdAt: new Date(now - 1*86400000) },
      { fromId: teacher._id, toId: parents[0]._id, body: 'רק לוודא שהוא מגיש את שיעורי הבית בזמן. היו כמה פעמים שהגיש באיחור קל. מלבד זה — תלמיד מעולה!', read: false, createdAt: new Date(now - 1*86400000 + 7200000) }
    ];
    for (const m of msgs) {
      await Message.create(m);
    }

    // ===== ACHIEVEMENTS for Daniel =====
    await Achievement.create([
      { studentId: students[0]._id, type: 'streak_5', name: 'streak 5 ימים', icon: 'fire' },
      { studentId: students[0]._id, type: 'behavior_star', name: 'מצטיין בהתנהגות', icon: 'sparkles' },
      { studentId: students[0]._id, type: 'attendance_100', name: '100% נוכחות', icon: 'check' },
      // Other students
      { studentId: students[3]._id, type: 'streak_attendance_15', name: '15 ימי נוכחות רצופים', icon: 'trophy' },
      { studentId: students[3]._id, type: 'points_500', name: '500 נקודות!', icon: 'star' },
      { studentId: students[1]._id, type: 'streak_attendance_10', name: '10 ימי נוכחות רצופים', icon: 'star' },
      { studentId: students[9]._id, type: 'points_400', name: '400 נקודות', icon: 'trophy' },
      { studentId: students[13]._id, type: 'points_400', name: '400 נקודות', icon: 'trophy' },
      { studentId: students[11]._id, type: 'points_300', name: '300 נקודות', icon: 'star' },
    ]);

    res.json({
      success: true,
      message: 'Demo data seeded! בית ספר הרצל ready.',
      logins: {
        teacher: { phone: '0501111111', name: 'רונית כהן' },
        student: { phone: '0501111112', name: 'דניאל לוי' },
        parent: { phone: '0501111113', name: 'יעל לוי' },
        admin: { phone: '0501111114', name: 'מיכל ברק' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
