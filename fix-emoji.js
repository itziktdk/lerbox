#!/usr/bin/env node
// Bulk emoji → icon() replacement for app.js
const fs = require('fs');

let code = fs.readFileSync('/home/itziktdk/.openclaw/workspace/school-app/public/js/app.js', 'utf8');

// Map of emoji → icon function call (for JS template literals)
const replacements = [
  // Nav config - these are icon property values, replace quotes too
  [/icon: '🏠'/g, "icon: icon('home')"],
  [/icon: '✅'/g, "icon: icon('check')"],
  [/icon: '⭐'/g, "icon: icon('star')"],
  [/icon: '📚'/g, "icon: icon('book')"],
  [/icon: '💬'/g, "icon: icon('chat')"],
  [/icon: '📢'/g, "icon: icon('megaphone')"],
  [/icon: '🏅'/g, "icon: icon('trophy')"],
  [/icon: '🏆'/g, "icon: icon('trophy')"],
  [/icon: '🏫'/g, "icon: icon('building')"],
  [/icon: '👥'/g, "icon: icon('users')"],
  [/icon: '⚙️'/g, "icon: icon('cog')"],

  // Inline emoji in template literals and strings
  // User avatar fallbacks
  [/\|\| '👤'/g, "|| icon('user')"],
  [/\$\{s\.avatar \|\| '👤'\}/g, "${s.avatar || icon('user')}"],
  [/\$\{sub\.studentId\?\.avatar \|\| '👤'\}/g, "${sub.studentId?.avatar || icon('user')}"],
  [/\$\{b\.avatar \|\| '👤'\}/g, "${b.avatar || icon('user')}"],

  // Stat icons
  [/class="stat-icon">✅</g, 'class="stat-icon">' + "' + icon('check') + '"],
  [/class="stat-icon">👥</g, 'class="stat-icon">' + "' + icon('users') + '"],
  [/class="stat-icon">⏰</g, 'class="stat-icon">' + "' + icon('clock') + '"],
  [/class="stat-icon">❌</g, 'class="stat-icon">' + "' + icon('xCircle') + '"],
  [/class="stat-icon">📝</g, 'class="stat-icon">' + "' + icon('pencil') + '"],
  [/class="stat-icon">⭐</g, 'class="stat-icon">' + "' + icon('star') + '"],

  // Headings and labels with emoji prefix
  [/'👋 שלום, \$/g, "'" + "${icon('home')} שלום, $"],
  
  // Behavior icons  
  [/class="bh-icon">🌟</g, 'class="bh-icon">' + "' + icon('sparkles') + '"],
  [/class="bh-icon">⚠️</g, 'class="bh-icon">' + "' + icon('bolt') + '"],
  [/class="bh-icon">⏰</g, 'class="bh-icon">' + "' + icon('clock') + '"],
];

// Actually, let me do simpler direct string replacements
const simpleReplacements = [
  // Nav icons
  ["icon: '🏠'", "icon: icon('home')"],
  ["icon: '✅'", "icon: icon('check')"],
  ["icon: '⭐'", "icon: icon('star')"],
  ["icon: '📚'", "icon: icon('book')"],
  ["icon: '💬'", "icon: icon('chat')"],
  ["icon: '📢'", "icon: icon('megaphone')"],
  ["icon: '🏅'", "icon: icon('trophy')"],
  ["icon: '🏆'", "icon: icon('trophy')"],
  ["icon: '🏫'", "icon: icon('building')"],
  ["icon: '👥'", "icon: icon('users')"],
  ["icon: '⚙️'", "icon: icon('cog')"],
  
  // Avatar fallbacks  
  ["|| '👤'", "|| icon('user')"],
  
  // Stat icons in template literals
  ["<div class=\"stat-icon\">✅</div>", "<div class=\"stat-icon\">${icon('check')}</div>"],
  ["<div class=\"stat-icon\">👥</div>", "<div class=\"stat-icon\">${icon('users')}</div>"],
  ["<div class=\"stat-icon\">⏰</div>", "<div class=\"stat-icon\">${icon('clock')}</div>"],
  ["<div class=\"stat-icon\">❌</div>", "<div class=\"stat-icon\">${icon('xCircle')}</div>"],
  ["<div class=\"stat-icon\">📝</div>", "<div class=\"stat-icon\">${icon('pencil')}</div>"],
  ["<div class=\"stat-icon\">⭐</div>", "<div class=\"stat-icon\">${icon('star')}</div>"],
  
  // Behavior icons
  ["<div class=\"bh-icon\">🌟</div>", "<div class=\"bh-icon\">${icon('sparkles')}</div>"],
  ["<div class=\"bh-icon\">⚠️</div>", "<div class=\"bh-icon\">${icon('bolt')}</div>"],
  ["<div class=\"bh-icon\">⏰</div>", "<div class=\"bh-icon\">${icon('clock')}</div>"],
  
  // Heading emoji
  ["👋 שלום", "${icon('home')} שלום"],
  
  // Quick action buttons
  ["✅ נוכחות</button>", "${icon('check')} נוכחות</button>"],
  ["⭐ התנהגות</button>", "${icon('star')} התנהגות</button>"],
  ["📚 שיעורי בית</button>", "${icon('book')} שיעורי בית</button>"],
  ["📢 הודעה</button>", "${icon('megaphone')} הודעה</button>"],
  
  // Card titles
  ["⚡ פעולות מהירות", "${icon('bolt')} פעולות מהירות"],
  ["👥 תלמידי הכיתה", "${icon('users')} תלמידי הכיתה"],
  
  // Section headings
  ["<h2 class=\"text-2xl font-bold mb-2\">✅ נוכחות</h2>", "<h2 class=\"text-2xl font-bold mb-2\">${icon('check')} נוכחות</h2>"],
  ["<h2 class=\"text-2xl font-bold mb-4\">⭐ דיווח התנהגות</h2>", "<h2 class=\"text-2xl font-bold mb-4\">${icon('star')} דיווח התנהגות</h2>"],
  ["<h2 class=\"text-2xl font-bold mb-4\">📚 שיעורי בית</h2>", "<h2 class=\"text-2xl font-bold mb-4\">${icon('book')} שיעורי בית</h2>"],
  ["<h2 class=\"text-2xl font-bold mb-4\">💬 צ'אט", "<h2 class=\"text-2xl font-bold mb-4\">${icon('chat')} צ'אט"],
  ["<h2 class=\"text-2xl font-bold mb-4\">💬 ", "<h2 class=\"text-2xl font-bold mb-4\">${icon('chat')} "],
  
  // Attendance buttons
  ["title=\"נוכח/ת\">✅</button>", "title=\"נוכח/ת\">${icon('check',16)}</button>"],
  ["title=\"איחור\">⏰</button>", "title=\"איחור\">${icon('clock',16)}</button>"],
  ["title=\"חיסור\">❌</button>", "title=\"חיסור\">${icon('xCircle',16)}</button>"],
  
  // Save button
  ["💾 שמירת נוכחות", "${icon('save')} שמירת נוכחות"],
  
  // Attendance summary
  ["<span>✅ ${counts.present}</span> <span>⏰ ${counts.late}</span> <span>❌ ${counts.absent}</span>",
   "<span>${icon('check',14)} ${counts.present}</span> <span>${icon('clock',14)} ${counts.late}</span> <span>${icon('xCircle',14)} ${counts.absent}</span>"],
  
  // Behavior stats
  ["<div style=\"font-size:1.5rem\">🌟</div>", "<div style=\"font-size:1.5rem\">${icon('sparkles')}</div>"],
  ["<div style=\"font-size:1.5rem\">⚠️</div>", "<div style=\"font-size:1.5rem\">${icon('bolt')}</div>"],
  ["<div style=\"font-size:1.5rem\">⏰</div>", "<div style=\"font-size:1.5rem\">${icon('clock')}</div>"],
  ["<div style=\"font-size:1.5rem\">📊</div>", "<div style=\"font-size:1.5rem\">${icon('chartBar')}</div>"],
  
  // Behavior type icons in reports
  ["${b.type === 'positive' ? '🌟' : b.type === 'disruption' ? '⚠️' : '⏰'}", "${b.type === 'positive' ? icon('sparkles') : b.type === 'disruption' ? icon('bolt') : icon('clock')}"],
  
  // Behavior options
  ["<option value=\"positive\"${filterType === 'positive' ? ' selected' : ''}>🌟 חיובי</option>",
   "<option value=\"positive\"${filterType === 'positive' ? ' selected' : ''}>${icon('sparkles',14)} חיובי</option>"],
  ["<option value=\"disruption\"${filterType === 'disruption' ? ' selected' : ''}>⚠️ הפרעה</option>",
   "<option value=\"disruption\"${filterType === 'disruption' ? ' selected' : ''}>${icon('bolt',14)} הפרעה</option>"],
  ["<option value=\"lateness\"${filterType === 'lateness' ? ' selected' : ''}>⏰ איחור</option>",
   "<option value=\"lateness\"${filterType === 'lateness' ? ' selected' : ''}>${icon('clock',14)} איחור</option>"],
  
  // Delete buttons
  ["title=\"מחיקת דיווח\">🗑️</button>", "title=\"מחיקת דיווח\">${icon('trash',14)}</button>"],
  ["title=\"מחיקה\">🗑️</button>", "title=\"מחיקה\">${icon('trash',14)}</button>"],
  
  // Submit buttons
  ["📝 שליחת דיווח", "${icon('pencil')} שליחת דיווח"],
  ["📝 יצירת שיעורי בית", "${icon('pencil')} יצירת שיעורי בית"],
  
  // Card titles with emoji
  ["📋 דיווחים", "${icon('clipboard')} דיווחים"],
  ["📋 שיעורי בית קיימים", "${icon('clipboard')} שיעורי בית קיימים"],
  ["📋 הגשות תלמידים", "${icon('clipboard')} הגשות תלמידים"],
  ["➕ הוספת שיעורי בית", "${icon('plus')} הוספת שיעורי בית"],
  
  // Homework icons
  ["${overdue ? '⏰' : '📝'}", "${overdue ? icon('clock') : icon('pencil')}"],
  
  // Status labels
  ["'pending': '⏳ טרם הוגש'", "'pending': icon('clock',14) + ' טרם הוגש'"],
  ["'submitted': '✅ הוגש'", "'submitted': icon('check',14) + ' הוגש'"],
  ["'late': '⚠️ באיחור'", "'late': icon('bolt',14) + ' באיחור'"],
  ["'graded': '⭐ נבדק'", "'graded': icon('star',14) + ' נבדק'"],
  
  // Grade button
  ["✅ ציון</button>", "${icon('check',14)} ציון</button>"],
  
  // Section heading for homework detail
  ["📝 ${hw.title}", "${icon('pencil')} ${hw.title}"],
  
  // Toast messages
  ["'✅ נוכחות נשמרה בהצלחה!'", "icon('check',14) + ' נוכחות נשמרה בהצלחה!'"],
  ["'🌟 דיווח חיובי נשלח!'", "icon('sparkles',14) + ' דיווח חיובי נשלח!'"],
  ["'📝 דיווח נשמר'", "icon('pencil',14) + ' דיווח נשמר'"],
  ["'🗑️ דיווח נמחק'", "icon('trash',14) + ' דיווח נמחק'"],
  ["`⭐ ציון ${grade} ניתן!`", "`${icon('star',14)} ציון ${grade} ניתן!`"],
  ["'🗑️ שיעורי בית נמחקו'", "icon('trash',14) + ' שיעורי בית נמחקו'"],
  ["'📚 שיעורי בית נוצרו!'", "icon('book',14) + ' שיעורי בית נוצרו!'"],
  
  // Under construction
  ["🚧 בבנייה", "${icon('wrench')} בבנייה"],
  
  // User icon in chat/messages
  ["<span style=\"font-size:1.3rem\">👤</span>", "<span style=\"font-size:1.3rem\">${icon('user')}</span>"],
  ["<span style=\"font-size:1.3rem\">${s.avatar || icon('user')}</span>", "<span style=\"font-size:1.3rem\">${s.avatar || icon('user')}</span>"],
];

for (const [from, to] of simpleReplacements) {
  code = code.split(from).join(to);
}

// Catch remaining emoji
// 🚧
code = code.replace(/🚧/g, '⚒');

fs.writeFileSync('/home/itziktdk/.openclaw/workspace/school-app/public/js/app.js', code);
console.log('app.js processed');

// Count remaining emoji
const remaining = code.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FAFF}\u{2B50}\u{23F0}\u{2705}\u{274C}\u{2728}\u{267B}\u{26A0}\u{25B6}\u{25C0}\u{2B06}\u{2B07}\u{2699}\u{27A1}\u{2795}\u{23F3}\u{2B1B}]/gu);
if (remaining) {
  console.log('Remaining emoji:', [...new Set(remaining)]);
}
