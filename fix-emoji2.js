#!/usr/bin/env node
const fs = require('fs');
const f = '/home/itziktdk/.openclaw/workspace/school-app/public/js/app.js';
let c = fs.readFileSync(f, 'utf8');

const r = [
  // Error/retry
  ['😵', "${icon('xCircle',32)}"],
  ['🔄 נסו שוב', "${icon('bolt')} נסו שוב"],
  ['⚒', "${icon('wrench')}"],
  
  // Points popup
  ["'✅ נשמר!'", "icon('check',14)+' נשמר!'"],
  ["'+5 נקודות! 🌟'", "'+5 נקודות! '+icon('sparkles',14)"],
  ["'+3 נקודות! 🌟'", "'+3 נקודות! '+icon('sparkles',14)"],

  // Status labels (the ones that weren't caught)
  ["'⏳ טרם הוגש'", "icon('clock',14)+' טרם הוגש'"],
  ["'✅ הוגש'", "icon('check',14)+' הוגש'"],
  ["'⚠️ באיחור'", "icon('bolt',14)+' באיחור'"],
  ["'⭐ נבדק'", "icon('star',14)+' נבדק'"],
  
  // Send button
  ['📤', "${icon('megaphone',16)}"],
  
  // Rank
  ["'🥇'", "icon('trophy',16)"],
  ["'🥈'", "icon('trophy',16)"],
  ["'🥉'", "icon('trophy',16)"],
  
  // Stat icons
  ['<div class="stat-icon">🏅</div>', '<div class="stat-icon">${icon("trophy")}</div>'],
  ['<div class="streak-icon">🔥</div>', '<div class="streak-icon">${icon("fire")}</div>'],
  ['<div class="streak-icon">📚</div>', '<div class="streak-icon">${icon("book")}</div>'],
  ['<div class="stat-icon">🔥</div>', '<div class="stat-icon">${icon("fire")}</div>'],
  ['<div class="stat-icon">📚</div>', '<div class="stat-icon">${icon("book")}</div>'],
  ['<div class="stat-icon">🏫</div>', '<div class="stat-icon">${icon("building")}</div>'],
  ['<div class="stat-icon">👨🏫</div>', '<div class="stat-icon">${icon("academicCap")}</div>'],
  ['<div class="stat-icon">👦</div>', '<div class="stat-icon">${icon("user")}</div>'],
  ['<div class="stat-icon">👨👩👧</div>', '<div class="stat-icon">${icon("familyParent")}</div>'],
  ['<div class="stat-icon">⚠️</div>', '<div class="stat-icon">${icon("bolt")}</div>'],
  
  // Challenges
  ['🎯 אתגרים יומיים', '${icon("target")} אתגרים יומיים'],
  ["${c.done ? '✅' : '⬜'}", "${c.done ? icon('check',16) : icon('xCircle',16)}"],
  
  // Homework icons (remaining)
  ['<div class="homework-icon">📝</div>', '<div class="homework-icon">${icon("pencil")}</div>'],
  ["${status === 'submitted' || status === 'graded' ? '✅' : '📝'}", "${status === 'submitted' || status === 'graded' ? icon('check') : icon('pencil')}"],
  
  // Headings
  ['🏅 הישגים', '${icon("trophy")} הישגים'],
  ['📚 שיעורי הבית שלי', '${icon("book")} שיעורי הבית שלי'],
  ['🏆 טבלת מובילים', '${icon("trophy")} טבלת מובילים'],
  ['👦 ${child.name}', '${icon("user")} ${child.name}'],
  ['📢 עדכונים', '${icon("megaphone")} עדכונים'],
  
  // Chat parent icon
  ['<span style="font-size:1.3rem">🏫</span>', '<span style="font-size:1.3rem">${icon("building")}</span>'],
  
  // Admin
  ['👩💼 לוח מנהל/ת', '${icon("briefcase")} לוח מנהל/ת'],
  ['🏫 מצב כיתות', '${icon("building")} מצב כיתות'],
  ['🏆 מובילי הנקודות', '${icon("trophy")} מובילי הנקודות'],
  
  // Class management
  ['🏫 ${c.name}', '${icon("building")} ${c.name}'],
  ['👦 ${c.studentCount', '${icon("user")} ${c.studentCount'],
  ['👨🏫 ${c.teacherId', '${icon("academicCap")} ${c.teacherId'],
  ['✏️ עריכה', '${icon("pencil",14)} עריכה'],
  ['🗑️ מחיקה', '${icon("trash",14)} מחיקה'],
  ['🏫 ניהול כיתות', '${icon("building")} ניהול כיתות'],
  ['➕ כיתה חדשה', '${icon("plus")} כיתה חדשה'],
  ['➕ יצירה', '${icon("plus")} יצירה'],
  ['✏️ עריכת כיתה', '${icon("pencil")} עריכת כיתה'],
  
  // Toasts
  ["'🏫 כיתה נוצרה!'", "icon('building',14)+' כיתה נוצרה!'"],
  ["'✅ כיתה עודכנה!'", "icon('check',14)+' כיתה עודכנה!'"],
  ["'🗑️ כיתה נמחקה'", "icon('trash',14)+' כיתה נמחקה'"],
  ["'✅ משתמש נוסף!'", "icon('check',14)+' משתמש נוסף!'"],
  ["'✅ הגדרות נשמרו!'", "icon('check',14)+' הגדרות נשמרו!'"],
  ["'📢 הודעה פורסמה!'", "icon('megaphone',14)+' הודעה פורסמה!'"],
  ["'📚 שיעורי בית הוגשו! +3 נקודות'", "icon('book',14)+' שיעורי בית הוגשו! +3 נקודות'"],
  
  // Admin role filters
  ['👨🏫 מורים', '${icon("academicCap",14)} מורים'],
  ['👦 תלמידים', '${icon("user",14)} תלמידים'],
  ['👨👩👧 הורים', '${icon("familyParent",14)} הורים'],
  
  // Role icons object
  ["teacher: '👨🏫'", "teacher: icon('academicCap')"],
  ["student: '👦'", "student: icon('user')"],
  ["parent: '👨👩👧'", "parent: icon('familyParent')"],
  ["admin: '👩💼'", "admin: icon('briefcase')"],
  
  // Users management
  ['👥 ניהול משתמשים', '${icon("users")} ניהול משתמשים'],
  ['➕ משתמש חדש', '${icon("plus")} משתמש חדש'],
  ['➕ הוספה', '${icon("plus")} הוספה'],
  ['📝 ${filtered.length}', '${icon("pencil")} ${filtered.length}'],
  
  // Settings
  ['⚙️ הגדרות בית הספר', '${icon("cog")} הגדרות בית הספר'],
  ['🏫 פרטי בית הספר', '${icon("building")} פרטי בית הספר'],
  ['🎮 גיימיפיקציה', '${icon("puzzle")} גיימיפיקציה'],
  ['🏆 טבלת מובילים', '${icon("trophy")} טבלת מובילים'],
  ['⭐ נקודות ותגים', '${icon("star")} נקודות ותגים'],
  ['💾 שמירת שינויים', '${icon("save")} שמירת שינויים'],
  
  // Announcements
  ['📢 הודעות ועדכונים', '${icon("megaphone")} הודעות ועדכונים'],
  ['➕ הודעה חדשה', '${icon("plus")} הודעה חדשה'],
  ['📢 פרסום', '${icon("megaphone")} פרסום'],
  
  // No homework celebration
  ["אין שיעורי בית 🎉", "אין שיעורי בית ${icon('checkBadge')}"],
  
  // Badge icon fallback
  ["${b.icon || '🏅'}", "${b.icon || icon('trophy')}"],
  
  // Clipboard/list titles remaining
  ['📋 שיעורי בית ממתינים', '${icon("clipboard")} שיעורי בית ממתינים'],
  
  // Submitted status text
  ["'הוגש ✓'", "'הוגש'"],
];

for (const [from, to] of r) {
  c = c.split(from).join(to);
}

fs.writeFileSync(f, c);

// Count remaining
const rem = c.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FAFF}\u{2B50}\u{23F0}\u{2705}\u{274C}\u{2728}\u{267B}\u{26A0}\u{25B6}\u{25C0}\u{2B06}\u{2B07}\u{2699}\u{27A1}\u{2795}\u{23F3}\u{2B1B}]/gu);
if (rem) {
  console.log('Remaining:', [...new Set(rem)]);
  // Show lines
  const lines = c.split('\n');
  lines.forEach((line, i) => {
    if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FAFF}\u{2B50}\u{23F0}\u{2705}\u{274C}\u{2728}\u{267B}\u{26A0}\u{25B6}\u{25C0}\u{2B06}\u{2B07}\u{2699}\u{27A1}\u{2795}\u{23F3}\u{2B1B}]/u.test(line)) {
      console.log(`  L${i+1}: ${line.trim().substring(0,120)}`);
    }
  });
} else {
  console.log('ALL EMOJI REMOVED from app.js!');
}
