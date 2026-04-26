// ===== LerBox — Frontend App =====
const API = '';
let state = { token: null, user: null, currentPage: 'home' };

// ===== HELPERS =====
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(API + path, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'שגיאה' }));
    throw new Error(err.error || 'שגיאה');
  }
  return res.json();
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.className = 'toast', 3000);
}

function showPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.remove('hidden');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function confetti() {
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 2 + 's';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// ===== AUTH =====
async function sendOTP() {
  const phone = document.getElementById('login-phone').value.replace(/\D/g, '');
  if (phone.length < 9) return toast('מספר טלפון לא תקין', 'error');
  try {
    const res = await api('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
    document.getElementById('login-step-phone').classList.add('hidden');
    document.getElementById('login-step-otp').classList.remove('hidden');
    toast(`קוד אימות: ${res.code}`, 'success');
    state._phone = phone;
  } catch (e) { toast(e.message, 'error'); }
}

async function verifyOTP() {
  const code = document.getElementById('login-otp').value;
  try {
    const res = await api('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone: state._phone, code }) });
    loginSuccess(res);
  } catch (e) { toast(e.message, 'error'); }
}

async function demoLogin(role) {
  try {
    // First seed demo data
    await api('/api/demo/seed', { method: 'POST' });
    const res = await api('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) });
    loginSuccess(res);
    confetti();
  } catch (e) { toast(e.message, 'error'); }
}

function loginSuccess(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('lerbox_token', data.token);
  localStorage.setItem('lerbox_user', JSON.stringify(data.user));
  enterApp();
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('lerbox_token');
  localStorage.removeItem('lerbox_user');
  showPage('landing');
}

function enterApp() {
  document.getElementById('header-name').textContent = state.user.name;
  const roleNames = { teacher: 'מורה', student: 'תלמיד/ה', parent: 'הורה', admin: 'מנהל/ת' };
  document.getElementById('header-role').textContent = roleNames[state.user.role] || state.user.role;
  document.getElementById('header-avatar').textContent = state.user.avatar || '👤';
  showPage('app');
  buildNav();
  navigateTo('home');
}

// ===== NAVIGATION =====
const navConfig = {
  teacher: [
    { id: 'home', icon: '🏠', label: 'ראשי' },
    { id: 'attendance', icon: '✅', label: 'נוכחות' },
    { id: 'behavior', icon: '⭐', label: 'התנהגות' },
    { id: 'homework', icon: '📚', label: 'שיעורי בית' },
    { id: 'messages', icon: '💬', label: 'צ\'אט' },
    { id: 'announcements', icon: '📢', label: 'הודעות' }
  ],
  student: [
    { id: 'home', icon: '🏠', label: 'ראשי' },
    { id: 'homework', icon: '📚', label: 'שיעורי בית' },
    { id: 'achievements', icon: '🏅', label: 'הישגים' },
    { id: 'leaderboard', icon: '🏆', label: 'טבלה' },
    { id: 'announcements', icon: '📢', label: 'הודעות' }
  ],
  parent: [
    { id: 'home', icon: '🏠', label: 'ראשי' },
    { id: 'messages', icon: '💬', label: 'הודעות' },
    { id: 'announcements', icon: '📢', label: 'עדכונים' }
  ],
  admin: [
    { id: 'home', icon: '🏠', label: 'ראשי' },
    { id: 'announcements', icon: '📢', label: 'הודעות' },
    { id: 'reports', icon: '📊', label: 'דוחות' }
  ]
};

function buildNav() {
  const nav = document.getElementById('bottom-nav');
  const items = navConfig[state.user.role] || navConfig.student;
  nav.innerHTML = items.map(i => `
    <button class="bottom-nav-item ${i.id === 'home' ? 'active' : ''}" onclick="navigateTo('${i.id}')" data-nav="${i.id}">
      <span class="nav-icon">${i.icon}</span>
      <span>${i.label}</span>
    </button>
  `).join('');
}

function navigateTo(page) {
  state.currentPage = page;
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.toggle('active', b.dataset.nav === page));
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  const renderers = {
    teacher: { home: renderTeacherHome, attendance: renderAttendance, behavior: renderBehavior, homework: renderTeacherHomework, messages: renderTeacherMessages, announcements: renderAnnouncements },
    student: { home: renderStudentHome, homework: renderStudentHomework, achievements: renderAchievements, leaderboard: renderLeaderboard, announcements: renderAnnouncements },
    parent: { home: renderParentHome, messages: renderMessages, announcements: renderAnnouncements },
    admin: { home: renderAdminHome, announcements: renderAnnouncements, reports: renderReports }
  };

  const render = renderers[state.user.role]?.[page];
  if (render) render(content);
  else content.innerHTML = '<div class="text-center p-4"><h2>🚧 בבנייה</h2></div>';
}

// ===== TEACHER VIEWS =====
async function renderTeacherHome(el) {
  const classId = state.user.classId?._id || state.user.classId;
  let students = [], stats = { present: 0, late: 0, absent: 0, rate: 0 };
  try {
    if (classId) {
      [students, stats] = await Promise.all([
        api(`/api/classes/${classId}/students`),
        api(`/api/attendance/stats/${classId}`)
      ]);
    }
  } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">👋 שלום, ${state.user.name}</h2>
    <div class="stats-row">
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${stats.rate}%</div>
        <div class="stat-label">נוכחות</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${students.length}</div>
        <div class="stat-label">תלמידים</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">⏰</div>
        <div class="stat-value">${stats.late}</div>
        <div class="stat-label">איחורים</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">❌</div>
        <div class="stat-value">${stats.absent}</div>
        <div class="stat-label">חיסורים</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">⚡ פעולות מהירות</span>
      </div>
      <div class="flex gap-3" style="flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigateTo('attendance')">✅ נוכחות</button>
        <button class="btn btn-success" onclick="navigateTo('behavior')">⭐ התנהגות</button>
        <button class="btn btn-outline" onclick="navigateTo('homework')">📚 שיעורי בית</button>
        <button class="btn btn-outline" onclick="navigateTo('announcements')">📢 הודעה</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">👥 תלמידי הכיתה</span></div>
      ${students.map(s => `
        <div class="leaderboard-item">
          <span style="font-size:1.3rem">${s.avatar || '👤'}</span>
          <span class="leaderboard-name">${s.name}</span>
          <span class="text-sm text-primary font-bold">${s.points} נק׳</span>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderAttendance(el) {
  const classId = state.user.classId?._id || state.user.classId;
  if (!classId) { el.innerHTML = '<p class="text-center p-4">אין כיתה משויכת</p>'; return; }

  const students = await api(`/api/classes/${classId}/students`);
  const today = new Date().toISOString().split('T')[0];

  // Check existing attendance
  let existing = {};
  try {
    const records = await api(`/api/attendance?classId=${classId}&date=${today}&period=1`);
    if (records.length > 0) {
      records[0].records.forEach(r => {
        existing[r.studentId?._id || r.studentId] = r.status;
      });
    }
  } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">✅ נוכחות</h2>
    <div class="flex items-center gap-3 mb-4">
      <input type="date" id="att-date" class="form-input" value="${today}" style="max-width:200px" dir="ltr">
      <select id="att-period" class="form-input" style="max-width:120px">
        ${[1,2,3,4,5,6,7,8].map(p => `<option value="${p}">שיעור ${p}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      <div class="attendance-grid" id="att-grid">
        ${students.map(s => `
          <div class="attendance-row" data-student="${s._id}">
            <div class="attendance-name">
              <span class="avatar">${s.avatar || '👤'}</span>
              <span>${s.name}</span>
            </div>
            <div class="attendance-actions">
              <button class="att-btn ${(existing[s._id] || 'present') === 'present' ? 'active-present' : ''}" onclick="setAtt(this, '${s._id}', 'present')" title="נוכח/ת">✅</button>
              <button class="att-btn ${existing[s._id] === 'late' ? 'active-late' : ''}" onclick="setAtt(this, '${s._id}', 'late')" title="איחור">⏰</button>
              <button class="att-btn ${existing[s._id] === 'absent' ? 'active-absent' : ''}" onclick="setAtt(this, '${s._id}', 'absent')" title="חיסור">❌</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div id="att-summary" class="attendance-summary flex gap-4 justify-center p-3" style="font-size:1.1em;font-weight:600"></div>
      <div class="mt-4">
        <button class="btn btn-primary btn-full btn-lg" onclick="saveAttendance()">💾 שמירת נוכחות</button>
      </div>
    </div>
  `;

  // Initialize state
  window._attState = {};
  students.forEach(s => window._attState[s._id] = existing[s._id] || 'present');
  updateAttSummary();

  // Reload attendance when date/period changes
  document.getElementById('att-date').addEventListener('change', () => reloadAttendance());
  document.getElementById('att-period').addEventListener('change', () => reloadAttendance());
}

async function reloadAttendance() {
  const classId = state.user.classId?._id || state.user.classId;
  const date = document.getElementById('att-date').value;
  const period = document.getElementById('att-period').value;
  let existing = {};
  try {
    const records = await api(`/api/attendance?classId=${classId}&date=${date}&period=${period}`);
    if (records.length > 0) {
      records[0].records.forEach(r => {
        existing[r.studentId?._id || r.studentId] = r.status;
      });
    }
  } catch(e) {}

  document.querySelectorAll('.attendance-row').forEach(row => {
    const sid = row.dataset.student;
    const status = existing[sid] || 'present';
    window._attState[sid] = status;
    row.querySelectorAll('.att-btn').forEach(b => b.className = 'att-btn');
    row.querySelector(`.att-btn[title="${status === 'present' ? 'נוכח/ת' : status === 'late' ? 'איחור' : 'חיסור'}"]`)?.classList.add(`active-${status}`);
  });
  updateAttSummary();
}

function updateAttSummary() {
  const counts = { present: 0, late: 0, absent: 0 };
  Object.values(window._attState || {}).forEach(s => counts[s]++);
  const total = counts.present + counts.late + counts.absent;
  const el = document.getElementById('att-summary');
  if (el) el.innerHTML = `<span>✅ ${counts.present}</span> <span>⏰ ${counts.late}</span> <span>❌ ${counts.absent}</span> <span style="margin-right:8px">| סה"כ: ${total}</span>`;
}

function setAtt(btn, studentId, status) {
  window._attState[studentId] = status;
  const row = btn.closest('.attendance-row');
  row.querySelectorAll('.att-btn').forEach(b => b.className = 'att-btn');
  btn.classList.add(`active-${status}`);
  updateAttSummary();
}

async function saveAttendance() {
  const classId = state.user.classId?._id || state.user.classId;
  const date = document.getElementById('att-date').value;
  const period = parseInt(document.getElementById('att-period').value);
  const records = Object.entries(window._attState).map(([studentId, status]) => ({ studentId, status }));

  try {
    await api('/api/attendance', { method: 'POST', body: JSON.stringify({ classId, date, period, records }) });
    toast('✅ נוכחות נשמרה בהצלחה!', 'success');
    confetti();
  } catch (e) { toast(e.message, 'error'); }
}

async function renderBehavior(el) {
  const classId = state.user.classId?._id || state.user.classId;
  if (!classId) { el.innerHTML = '<p class="text-center p-4">אין כיתה משויכת</p>'; return; }

  const today = new Date().toISOString().split('T')[0];
  const filterDate = window._bhFilterDate || today;
  const filterType = window._bhFilterType || '';

  let bhUrl = `/api/behavior?classId=${classId}&date=${filterDate}`;
  if (filterType) bhUrl += `&type=${filterType}`;

  const [students, behaviors, stats] = await Promise.all([
    api(`/api/classes/${classId}/students`),
    api(bhUrl),
    api(`/api/behavior/stats?classId=${classId}&date=${filterDate}`)
  ]);

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">⭐ דיווח התנהגות</h2>

    <!-- Stats Summary -->
    <div class="card mb-4">
      <div style="display:flex;justify-content:space-around;text-align:center;padding:0.5rem 0">
        <div><div style="font-size:1.5rem">🌟</div><div class="font-bold text-green">${stats.positive}</div><div class="text-xs text-gray">חיובי</div></div>
        <div><div style="font-size:1.5rem">⚠️</div><div class="font-bold text-red">${stats.disruption}</div><div class="text-xs text-gray">הפרעה</div></div>
        <div><div style="font-size:1.5rem">⏰</div><div class="font-bold" style="color:var(--gold)">${stats.lateness}</div><div class="text-xs text-gray">איחור</div></div>
        <div><div style="font-size:1.5rem">📊</div><div class="font-bold">${stats.totalPoints > 0 ? '+' : ''}${stats.totalPoints}</div><div class="text-xs text-gray">נקודות</div></div>
      </div>
    </div>

    <!-- Report Form -->
    <div class="card">
      <div class="form-group">
        <label>בחירת תלמיד/ה</label>
        <select id="bh-student" class="form-input">
          ${students.map(s => `<option value="${s._id}">${s.avatar || '👤'} ${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>סוג דיווח</label>
        <div class="behavior-btns">
          <button class="behavior-btn positive" onclick="selectBehavior(this, 'positive')">
            <div class="bh-icon">🌟</div>
            <div class="bh-label">חיובי</div>
          </button>
          <button class="behavior-btn disruption" onclick="selectBehavior(this, 'disruption')">
            <div class="bh-icon">⚠️</div>
            <div class="bh-label">הפרעה</div>
          </button>
          <button class="behavior-btn lateness" onclick="selectBehavior(this, 'lateness')">
            <div class="bh-icon">⏰</div>
            <div class="bh-label">איחור</div>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>שיעור (אופציונלי)</label>
        <select id="bh-period" class="form-input">
          <option value="">— בחרו שיעור —</option>
          ${[1,2,3,4,5,6,7,8].map(p => `<option value="${p}">שיעור ${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>הערה (אופציונלי)</label>
        <input type="text" id="bh-note" class="form-input" placeholder="הוסיפו הערה...">
      </div>
      <button class="btn btn-primary btn-full" onclick="submitBehavior()">📝 שליחת דיווח</button>
    </div>

    <!-- Filter & History -->
    <div class="card mt-4">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem">
        <span class="card-title">📋 דיווחים</span>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
          <input type="date" id="bh-filter-date" class="form-input" value="${filterDate}" onchange="window._bhFilterDate=this.value;renderBehavior(document.getElementById('app-content'))" style="width:auto;padding:0.3rem 0.5rem;font-size:0.85rem">
          <select id="bh-filter-type" class="form-input" onchange="window._bhFilterType=this.value;renderBehavior(document.getElementById('app-content'))" style="width:auto;padding:0.3rem 0.5rem;font-size:0.85rem">
            <option value=""${!filterType ? ' selected' : ''}>הכל</option>
            <option value="positive"${filterType === 'positive' ? ' selected' : ''}>🌟 חיובי</option>
            <option value="disruption"${filterType === 'disruption' ? ' selected' : ''}>⚠️ הפרעה</option>
            <option value="lateness"${filterType === 'lateness' ? ' selected' : ''}>⏰ איחור</option>
          </select>
        </div>
      </div>
      ${behaviors.length === 0 ? '<p class="text-center p-4 text-gray">אין דיווחים לתאריך זה</p>' : ''}
      ${behaviors.map(b => `
        <div class="leaderboard-item">
          <span style="font-size:1.3rem">${b.type === 'positive' ? '🌟' : b.type === 'disruption' ? '⚠️' : '⏰'}</span>
          <div style="flex:1">
            <div class="font-semibold">${b.studentId?.name || 'תלמיד'}</div>
            <div class="text-xs text-gray">${b.note || ''} ${b.period ? '• שיעור ' + b.period : ''} • ${formatTime(b.createdAt || b.date)}</div>
          </div>
          <span class="font-bold ${b.points > 0 ? 'text-green' : 'text-red'}" style="margin-left:0.5rem">${b.points > 0 ? '+' : ''}${b.points}</span>
          <button onclick="deleteBehavior('${b._id}')" style="background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.4;margin-right:0.25rem" title="מחיקת דיווח">🗑️</button>
        </div>
      `).join('')}
    </div>
  `;

  window._bhType = null;
}

function selectBehavior(btn, type) {
  document.querySelectorAll('.behavior-btn').forEach(b => {
    b.classList.remove('bh-selected');
  });
  btn.classList.add('bh-selected');
  window._bhType = type;
}

async function submitBehavior() {
  if (!window._bhType) return toast('בחרו סוג דיווח', 'error');
  const studentId = document.getElementById('bh-student').value;
  const note = document.getElementById('bh-note').value;
  const period = document.getElementById('bh-period').value;
  const classId = state.user.classId?._id || state.user.classId;
  try {
    await api('/api/behavior', { method: 'POST', body: JSON.stringify({ studentId, classId, type: window._bhType, note, period: period ? parseInt(period) : undefined }) });
    toast(window._bhType === 'positive' ? '🌟 דיווח חיובי נשלח!' : '📝 דיווח נשמר', 'success');
    if (window._bhType === 'positive') confetti();
    window._bhFilterDate = new Date().toISOString().split('T')[0];
    renderBehavior(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteBehavior(id) {
  if (!confirm('למחוק את הדיווח?')) return;
  try {
    await api(`/api/behavior/${id}`, { method: 'DELETE' });
    toast('🗑️ דיווח נמחק', 'success');
    renderBehavior(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

async function renderTeacherHomework(el) {
  const classId = state.user.classId?._id || state.user.classId;
  let homeworks = [], stats = {};
  try {
    [homeworks, stats] = await Promise.all([
      api(`/api/homework?classId=${classId}`),
      api(`/api/homework/stats/summary?classId=${classId}`)
    ]);
  } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📚 שיעורי בית</h2>

    <div class="stats-row">
      <div class="stat-card blue">
        <div class="stat-icon">📝</div>
        <div class="stat-value">${stats.total || 0}</div>
        <div class="stat-label">משימות</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-value">${stats.submissionRate || 0}%</div>
        <div class="stat-label">אחוז הגשה</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">${stats.graded || 0}</div>
        <div class="stat-label">ציונים</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">➕ הוספת שיעורי בית</span></div>
      <div class="form-group">
        <label>כותרת</label>
        <input type="text" id="hw-title" class="form-input" placeholder="למשל: תרגילים בשברים">
      </div>
      <div class="form-group">
        <label>תיאור</label>
        <textarea id="hw-desc" class="form-input" placeholder="פרטים נוספים..."></textarea>
      </div>
      <div class="form-group">
        <label>תאריך הגשה</label>
        <input type="date" id="hw-due" class="form-input" dir="ltr">
      </div>
      <button class="btn btn-primary btn-full" onclick="createHomework()">📝 יצירת שיעורי בית</button>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">📋 שיעורי בית קיימים</span></div>
      ${homeworks.map(hw => {
        const submitted = hw.submissions?.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0;
        const total = hw.submissions?.length || 0;
        const pending = total - submitted;
        const pct = total ? Math.round((submitted / total) * 100) : 0;
        const overdue = new Date(hw.dueDate) < new Date();
        return `
          <div class="homework-item" style="cursor:pointer" onclick="viewHomeworkDetail('${hw._id}')">
            <div class="homework-icon">${overdue ? '⏰' : '📝'}</div>
            <div class="homework-info" style="flex:1">
              <h4>${hw.title}</h4>
              <p>הגשה עד ${formatDate(hw.dueDate)} • ${submitted}/${total} הגישו${pending > 0 ? ` • <span style="color:var(--red)">${pending} חסרים</span>` : ''}</p>
              <div class="progress-bar mt-1"><div class="fill" style="width:${pct}%"></div></div>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <button class="btn btn-sm" onclick="event.stopPropagation();deleteHomework('${hw._id}')" title="מחיקה">🗑️</button>
            </div>
          </div>
        `;
      }).join('') || '<p class="text-gray text-center p-2">אין שיעורי בית עדיין</p>'}
    </div>
  `;
}

async function viewHomeworkDetail(hwId) {
  const el = document.getElementById('app-content');
  let hw;
  try { hw = await api(`/api/homework/${hwId}`); } catch(e) { return toast('שגיאה בטעינה', 'error'); }

  const statusLabel = { pending: '⏳ טרם הוגש', submitted: '✅ הוגש', late: '⚠️ באיחור', graded: '⭐ נבדק' };
  const statusClass = { pending: 'red', submitted: 'green', late: 'gold', graded: 'blue' };

  el.innerHTML = `
    <button class="btn btn-outline mb-4" onclick="renderTeacherHomework(document.getElementById('app-content'))">← חזרה</button>
    <h2 class="text-2xl font-bold mb-2">📝 ${hw.title}</h2>
    <p class="text-gray mb-4">${hw.description || ''} • הגשה עד ${formatDate(hw.dueDate)}</p>

    <div class="card">
      <div class="card-header"><span class="card-title">📋 הגשות תלמידים</span></div>
      ${(hw.submissions || []).map(sub => {
        const name = sub.studentId?.name || 'תלמיד/ה';
        const avatar = sub.studentId?.avatar || '👤';
        const sid = sub.studentId?._id || sub.studentId;
        return `
          <div class="leaderboard-item" style="flex-wrap:wrap">
            <span style="font-size:1.3rem">${avatar}</span>
            <span class="leaderboard-name" style="flex:1">${name}</span>
            <span class="badge badge-${statusClass[sub.status] || 'gray'}">${statusLabel[sub.status] || sub.status}</span>
            ${sub.status === 'submitted' || sub.status === 'late' ? `
              <div style="display:flex;gap:4px;align-items:center;margin-top:4px;width:100%;padding-right:2.5rem">
                <input type="number" id="grade-${sid}" class="form-input" style="width:80px" placeholder="ציון" min="0" max="100" value="${sub.grade || ''}">
                <button class="btn btn-sm btn-primary" onclick="gradeSubmission('${hwId}','${sid}')">✅ ציון</button>
              </div>
            ` : sub.status === 'graded' ? `
              <div style="margin-top:4px;width:100%;padding-right:2.5rem;color:var(--gold);font-weight:bold">
                ציון: ${sub.grade}
              </div>
            ` : ''}
          </div>
        `;
      }).join('') || '<p class="text-center text-gray p-2">אין הגשות עדיין</p>'}
    </div>
  `;
}

async function gradeSubmission(hwId, studentId) {
  const grade = parseInt(document.getElementById(`grade-${studentId}`).value);
  if (isNaN(grade) || grade < 0 || grade > 100) return toast('ציון חייב להיות בין 0 ל-100', 'error');
  try {
    await api(`/api/homework/${hwId}/grade`, { method: 'POST', body: JSON.stringify({ studentId, grade }) });
    toast(`⭐ ציון ${grade} ניתן!`, 'success');
    viewHomeworkDetail(hwId);
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteHomework(hwId) {
  if (!confirm('למחוק את שיעורי הבית?')) return;
  try {
    await api(`/api/homework/${hwId}`, { method: 'DELETE' });
    toast('🗑️ שיעורי בית נמחקו', 'success');
    renderTeacherHomework(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

async function createHomework() {
  const classId = state.user.classId?._id || state.user.classId;
  const title = document.getElementById('hw-title').value;
  const description = document.getElementById('hw-desc').value;
  const dueDate = document.getElementById('hw-due').value;
  if (!title || !dueDate) return toast('מלאו כותרת ותאריך הגשה', 'error');
  try {
    await api('/api/homework', { method: 'POST', body: JSON.stringify({ classId, title, description, dueDate }) });
    toast('📚 שיעורי בית נוצרו!', 'success');
    renderTeacherHomework(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

// ===== TEACHER MESSAGES =====
async function renderTeacherMessages(el) {
  let parents = [], messages = [], unread = { count: 0 };
  try {
    const classId = state.user.classId?._id || state.user.classId;
    [parents, messages, unread] = await Promise.all([
      api(`/api/classes/${classId}/parents`).catch(() => []),
      api('/api/messages'),
      api('/api/messages/unread')
    ]);
  } catch(e) {}

  // Group messages by conversation partner
  const convMap = {};
  messages.forEach(m => {
    const partnerId = m.fromId?._id === state.user._id ? m.toId?._id : m.fromId?._id;
    const partnerName = m.fromId?._id === state.user._id ? m.toId?.name : m.fromId?.name;
    if (!convMap[partnerId]) convMap[partnerId] = { name: partnerName || 'הורה', messages: [], unread: 0 };
    convMap[partnerId].messages.push(m);
    if (m.toId?._id === state.user._id && !m.read) convMap[partnerId].unread++;
  });

  // Also add parents with no messages yet
  parents.forEach(p => {
    if (!convMap[p._id]) convMap[p._id] = { name: p.name, messages: [], unread: 0 };
  });

  if (state._teacherChatWith) {
    return renderTeacherChat(el, state._teacherChatWith, convMap[state._teacherChatWith]?.name || 'הורה');
  }

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">💬 צ'אט עם הורים ${unread.count > 0 ? `<span class="badge badge-red">${unread.count}</span>` : ''}</h2>
    <div class="card">
      ${Object.entries(convMap).map(([id, conv]) => {
        const lastMsg = conv.messages[conv.messages.length - 1];
        return `
          <div class="leaderboard-item" style="cursor:pointer" onclick="openTeacherChat('${id}', '${conv.name}')">
            <span style="font-size:1.3rem">👤</span>
            <div style="flex:1">
              <div class="font-bold">${conv.name}</div>
              <div class="text-xs text-gray">${lastMsg ? lastMsg.body.substring(0, 40) + (lastMsg.body.length > 40 ? '...' : '') : 'לחצו להתחיל שיחה'}</div>
            </div>
            ${conv.unread > 0 ? `<span class="badge badge-red">${conv.unread}</span>` : ''}
            ${lastMsg ? `<span class="text-xs text-gray">${formatTime(lastMsg.createdAt)}</span>` : ''}
          </div>
        `;
      }).join('') || '<p class="text-center text-gray p-4">אין הורים בכיתה עדיין</p>'}
    </div>
  `;
}

function openTeacherChat(userId, name) {
  state._teacherChatWith = userId;
  state._teacherChatName = name;
  renderTeacherMessages(document.getElementById('app-content'));
}

async function renderTeacherChat(el, userId, name) {
  let messages = [];
  try {
    messages = await api(`/api/messages?withUser=${userId}`);
    await api(`/api/messages/read/${userId}`, { method: 'PUT' });
  } catch(e) {}

  el.innerHTML = `
    <button class="btn btn-outline mb-4" onclick="state._teacherChatWith=null;renderTeacherMessages(document.getElementById('app-content'))">← חזרה</button>
    <h2 class="text-2xl font-bold mb-4">💬 ${name}</h2>
    <div class="card">
      <div class="message-list" id="chat-messages" style="max-height:400px;overflow-y:auto">
        ${messages.map(m => `
          <div class="message-bubble ${m.fromId?._id === state.user._id ? 'sent' : ''}">
            <div class="text-xs font-bold mb-1">${m.fromId?.name || ''}</div>
            <div>${m.body}</div>
            <div class="msg-time">${formatTime(m.createdAt)}</div>
          </div>
        `).join('') || '<p class="text-center text-gray p-4">אין הודעות עדיין — שלחו הודעה ראשונה!</p>'}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <input type="text" id="chat-input" class="form-input" style="flex:1" placeholder="כתבו הודעה..." onkeypress="if(event.key==='Enter')sendTeacherMsg('${userId}')">
        <button class="btn btn-primary" onclick="sendTeacherMsg('${userId}')">📤</button>
      </div>
    </div>
  `;
  // Scroll to bottom
  const chatEl = document.getElementById('chat-messages');
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendTeacherMsg(toId) {
  const input = document.getElementById('chat-input');
  const body = input.value.trim();
  if (!body) return;
  try {
    await api('/api/messages', { method: 'POST', body: JSON.stringify({ toId, body }) });
    input.value = '';
    renderTeacherChat(document.getElementById('app-content'), toId, state._teacherChatName || 'הורה');
  } catch (e) { toast(e.message, 'error'); }
}

// ===== STUDENT VIEWS =====
async function renderStudentHome(el) {
  const user = state.user;
  let stats = {}, homeworks = [];
  try {
    [stats, homeworks] = await Promise.all([
      api('/api/achievements/student-stats'),
      api(`/api/homework?classId=${user.classId?._id || user.classId}`)
    ]);
  } catch(e) { stats = { points: user.points || 0, level: 1, levelTitle: 'מתחיל', levelProgress: 0, pointsInLevel: 0, pointsToNext: 30, streaks: user.streaks || {}, achievementCount: 0, totalAchievements: 12, rank: 1, classSize: 1, challenges: [] }; }

  const pendingHw = homeworks.filter(h => {
    const sub = h.submissions?.find(s => (s.studentId?._id || s.studentId) === user._id);
    return sub && sub.status === 'pending';
  });

  const rankSuffix = stats.rank === 1 ? '🥇' : stats.rank === 2 ? '🥈' : stats.rank === 3 ? '🥉' : `#${stats.rank}`;

  el.innerHTML = `
    <div class="student-hero">
      <div class="hero-avatar">${stats.avatar || user.avatar || '👤'}</div>
      <div class="hero-name">שלום, ${stats.name || user.name}!</div>
      <div class="hero-level">
        <span class="level-badge">Lv.${stats.level}</span>
        <span class="level-title">${stats.levelTitle}</span>
      </div>
      <div class="level-progress-wrap">
        <div class="level-progress-bar">
          <div class="level-progress-fill" style="width:${stats.levelProgress}%"></div>
        </div>
        <div class="level-progress-text">${stats.pointsInLevel}/${stats.pointsToNext} לרמה הבאה</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card primary">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">${stats.points}</div>
        <div class="stat-label">נקודות</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">${rankSuffix}</div>
        <div class="stat-value">${stats.rank}/${stats.classSize}</div>
        <div class="stat-label">דירוג בכיתה</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">🏅</div>
        <div class="stat-value">${stats.achievementCount}/${stats.totalAchievements}</div>
        <div class="stat-label">הישגים</div>
      </div>
    </div>

    <div class="streaks-section">
      <div class="streak-bar">
        <div class="streak-icon">🔥</div>
        <div class="streak-info">
          <h4>רצף נוכחות</h4>
          <p>${stats.streaks.attendance || 0} ימים רצופים</p>
        </div>
        <div class="streak-count">${stats.streaks.attendance || 0}</div>
      </div>
      <div class="streak-bar">
        <div class="streak-icon">📚</div>
        <div class="streak-info">
          <h4>רצף שיעורי בית</h4>
          <p>${stats.streaks.homework || 0} הגשות רצופות</p>
        </div>
        <div class="streak-count">${stats.streaks.homework || 0}</div>
      </div>
    </div>

    ${stats.challenges?.length ? `
      <div class="card mt-4">
        <div class="card-header"><span class="card-title">🎯 אתגרים יומיים</span></div>
        ${stats.challenges.map(c => `
          <div class="challenge-item ${c.done ? 'done' : ''}">
            <span class="challenge-icon">${c.icon}</span>
            <div class="challenge-info">
              <div class="challenge-title">${c.title}</div>
              <div class="challenge-reward">+${c.reward} נק׳</div>
            </div>
            <span class="challenge-status">${c.done ? '✅' : '⬜'}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${pendingHw.length > 0 ? `
      <div class="card mt-4">
        <div class="card-header"><span class="card-title">📋 שיעורי בית ממתינים</span></div>
        ${pendingHw.map(h => `
          <div class="homework-item">
            <div class="homework-icon">📝</div>
            <div class="homework-info">
              <h4>${h.title}</h4>
              <p>הגשה עד ${formatDate(h.dueDate)}</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="submitHomework('${h._id}')">הגשה</button>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

async function renderAchievements(el) {
  let catalog = [];
  try { catalog = await api('/api/achievements/catalog'); } catch(e) {}

  const categories = {};
  catalog.forEach(a => {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  });

  const unlockedCount = catalog.filter(a => a.unlocked).length;

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">🏅 הישגים</h2>
    <p class="text-gray mb-4">${unlockedCount} מתוך ${catalog.length} נפתחו</p>
    <div class="achievements-progress-bar mb-4">
      <div class="achievements-progress-fill" style="width:${catalog.length ? Math.round(unlockedCount/catalog.length*100) : 0}%"></div>
    </div>
    ${Object.entries(categories).map(([cat, items]) => `
      <div class="card mb-3">
        <div class="card-header"><span class="card-title">${cat}</span></div>
        <div class="achievements-grid">
          ${items.map(a => `
            <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${a.icon}</div>
              <div class="achievement-name">${a.name}</div>
              <div class="achievement-desc">${a.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

async function renderStudentHomework(el) {
  const classId = state.user.classId?._id || state.user.classId;
  let homeworks = [];
  try { homeworks = await api(`/api/homework?classId=${classId}`); } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📚 שיעורי הבית שלי</h2>
    ${homeworks.map(h => {
      const sub = h.submissions?.find(s => (s.studentId?._id || s.studentId) === state.user._id);
      const status = sub?.status || 'pending';
      const statusText = { pending: 'ממתין', submitted: 'הוגש ✓', late: 'באיחור', graded: 'נבדק' };
      return `
        <div class="homework-item">
          <div class="homework-icon">${status === 'submitted' || status === 'graded' ? '✅' : '📝'}</div>
          <div class="homework-info">
            <h4>${h.title}</h4>
            <p>${h.description || ''}</p>
            <p class="text-xs text-gray mt-1">הגשה עד ${formatDate(h.dueDate)}</p>
          </div>
          ${status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="submitHomework('${h._id}')">הגשה</button>` : `<span class="homework-status ${status}">${statusText[status]}</span>`}
        </div>
      `;
    }).join('') || '<p class="text-center text-gray p-4">אין שיעורי בית 🎉</p>'}
  `;
}

async function submitHomework(id) {
  try {
    await api(`/api/homework/${id}/submit`, { method: 'POST' });
    toast('📚 שיעורי בית הוגשו! +3 נקודות', 'success');
    confetti();
    state.user.points = (state.user.points || 0) + 3;
    renderStudentHomework(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

async function renderLeaderboard(el) {
  const classId = state.user.classId?._id || state.user.classId;
  let students = [];
  try { students = await api(`/api/users/leaderboard/class/${classId}`); } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">🏆 טבלת מובילים</h2>
    <div class="card">
      ${students.map((s, i) => `
        <div class="leaderboard-item ${s._id === state.user._id ? 'style="border: 2px solid var(--primary)"' : ''}">
          <div class="leaderboard-rank">${i + 1}</div>
          <span style="font-size:1.3rem">${s.avatar || '👤'}</span>
          <span class="leaderboard-name">${s.name} ${s._id === state.user._id ? '(את/ה)' : ''}</span>
          <span class="leaderboard-points">${s.points} נק׳</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== PARENT VIEWS =====
async function renderParentHome(el) {
  const user = state.user;
  let children = [], announcements = [];
  try {
    if (user.parentOf?.length) {
      children = await Promise.all(user.parentOf.map(id => api(`/api/users/${id}`)));
    }
    announcements = await api('/api/announcements');
  } catch(e) {}

  const child = children[0];

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">👋 שלום, ${user.name}</h2>

    ${child ? `
      <div class="card">
        <div class="card-header"><span class="card-title">👦 ${child.name}</span></div>
        <div class="stats-row">
          <div class="stat-card primary">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">${child.points || 0}</div>
            <div class="stat-label">נקודות</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${child.streaks?.attendance || 0}</div>
            <div class="stat-label">ימי נוכחות רצופים</div>
          </div>
          <div class="stat-card gold">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${child.streaks?.homework || 0}</div>
            <div class="stat-label">הגשות רצופות</div>
          </div>
        </div>
        ${child.badges?.length ? `
          <div class="badges-grid mt-2">
            ${child.badges.map(b => `
              <div class="badge-item"><div class="badge-icon">${b.icon || '🏅'}</div><div class="badge-name">${b.name}</div></div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : '<div class="card"><p class="text-center text-gray p-4">אין ילדים משויכים</p></div>'}

    <div class="card">
      <div class="card-header"><span class="card-title">📢 עדכונים</span></div>
      ${announcements.slice(0, 5).map(a => `
        <div class="announcement-item">
          <h4>${a.title}</h4>
          <p>${a.body}</p>
          <div class="ann-meta">${formatDate(a.createdAt)}</div>
        </div>
      `).join('') || '<p class="text-gray text-center p-2">אין עדכונים</p>'}
    </div>
  `;
}

async function renderMessages(el) {
  // Simple message view
  let messages = [];
  try { messages = await api('/api/messages'); } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">💬 הודעות</h2>
    <div class="card">
      <div class="message-list">
        ${messages.map(m => `
          <div class="message-bubble ${m.fromId?._id === state.user._id ? 'sent' : ''}">
            <div class="text-xs font-bold mb-1">${m.fromId?.name || 'מישהו'}</div>
            <div>${m.body}</div>
            <div class="msg-time">${formatTime(m.createdAt)}</div>
          </div>
        `).join('') || '<p class="text-center text-gray p-4">אין הודעות עדיין</p>'}
      </div>
    </div>
  `;
}

// ===== ADMIN VIEWS =====
async function renderAdminHome(el) {
  const classId = state.user.classId?._id || state.user.classId;
  let students = [], stats = { present: 0, late: 0, absent: 0, rate: 0 };
  try {
    const classes = await api('/api/classes');
    if (classes.length) {
      students = await api(`/api/classes/${classes[0]._id}/students`);
      stats = await api(`/api/attendance/stats/${classes[0]._id}`);
    }
  } catch(e) {}

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">👩‍💼 לוח מנהל/ת</h2>
    <div class="stats-row">
      <div class="stat-card green">
        <div class="stat-icon">📊</div>
        <div class="stat-value">${stats.rate}%</div>
        <div class="stat-label">אחוז נוכחות</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${students.length}</div>
        <div class="stat-label">תלמידים</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon">⏰</div>
        <div class="stat-value">${stats.late}</div>
        <div class="stat-label">איחורים</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">❌</div>
        <div class="stat-value">${stats.absent}</div>
        <div class="stat-label">חיסורים</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">🏆 מובילי הנקודות</span></div>
      ${students.sort((a,b) => b.points - a.points).slice(0, 5).map((s, i) => `
        <div class="leaderboard-item">
          <div class="leaderboard-rank">${i+1}</div>
          <span style="font-size:1.3rem">${s.avatar || '👤'}</span>
          <span class="leaderboard-name">${s.name}</span>
          <span class="leaderboard-points">${s.points} נק׳</span>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderReports(el) {
  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📊 דוחות</h2>
    <div class="card">
      <p class="text-center text-gray p-4">📈 דוחות מפורטים — בקרוב!</p>
    </div>
  `;
}

// ===== SHARED VIEWS =====
async function renderAnnouncements(el) {
  let announcements = [];
  try { announcements = await api('/api/announcements'); } catch(e) {}

  const canCreate = state.user.role === 'teacher' || state.user.role === 'admin';

  el.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">📢 הודעות ועדכונים</h2>
    ${canCreate ? `
      <div class="card">
        <div class="card-header"><span class="card-title">➕ הודעה חדשה</span></div>
        <div class="form-group">
          <label>כותרת</label>
          <input type="text" id="ann-title" class="form-input" placeholder="כותרת ההודעה">
        </div>
        <div class="form-group">
          <label>תוכן</label>
          <textarea id="ann-body" class="form-input" placeholder="תוכן ההודעה..."></textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="createAnnouncement()">📢 פרסום</button>
      </div>
    ` : ''}
    <div class="card">
      ${announcements.map(a => `
        <div class="announcement-item">
          <h4>${a.title}</h4>
          <p>${a.body}</p>
          <div class="ann-meta">${a.authorId?.name || ''} • ${formatDate(a.createdAt)}</div>
        </div>
      `).join('') || '<p class="text-center text-gray p-2">אין הודעות עדיין</p>'}
    </div>
  `;
}

async function createAnnouncement() {
  const title = document.getElementById('ann-title').value;
  const body = document.getElementById('ann-body').value;
  if (!title || !body) return toast('מלאו כותרת ותוכן', 'error');
  try {
    await api('/api/announcements', { method: 'POST', body: JSON.stringify({ title, body }) });
    toast('📢 הודעה פורסמה!', 'success');
    renderAnnouncements(document.getElementById('app-content'));
  } catch (e) { toast(e.message, 'error'); }
}

// ===== INIT =====
(function init() {
  const token = localStorage.getItem('lerbox_token');
  const user = localStorage.getItem('lerbox_user');
  if (token && user) {
    state.token = token;
    state.user = JSON.parse(user);
    enterApp();
  } else {
    showPage('landing');
  }
})();
