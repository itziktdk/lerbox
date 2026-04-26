const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'https://lerbox-app.azurewebsites.net';
const QA_DIR = path.join(__dirname, 'qa-demo');

async function loginWithPhone(page, phone, screenshotName, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto(BASE, { timeout: 90000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await page.locator('button:has-text("כניסה למערכת")').first().click({ timeout: 10000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(QA_DIR, screenshotName), fullPage: true });
      await page.locator('#login-phone').fill(phone);
      await page.locator('button:has-text("שלחו לי קוד")').first().click({ timeout: 10000 });
      await page.waitForTimeout(2000);
      const toast = await page.locator('#toast').textContent();
      const codeMatch = toast.match(/(\d{4})/);
      if (!codeMatch) throw new Error(`No OTP in toast: "${toast}"`);
      await page.locator('#login-otp').fill(codeMatch[1]);
      await page.locator('button:has-text("אימות")').first().click({ timeout: 10000 });
      await page.waitForTimeout(2500);
      return;
    } catch (e) {
      console.log(`  Attempt ${attempt}/${retries} failed: ${e.message.split('\n')[0]}`);
      if (attempt === retries) throw e;
      await page.waitForTimeout(5000);
    }
  }
}

async function clickNav(page, label) {
  const btn = page.locator(`.bottom-nav-item:has-text("${label}")`).first();
  try {
    await btn.click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    return true;
  } catch { return false; }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  function log(test, status, file, note = '') {
    results.push({ test, status, file, note });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test} → ${file} ${note}`);
  }

  const tests = [
    { role: 'TEACHER', phone: '0501111111', loginFile: 'teacher-login.png', dashFile: 'teacher-dashboard.png',
      navTests: [
        { label: 'נוכחות', file: 'teacher-attendance.png', name: 'Teacher Attendance' },
        { label: 'התנהגות', file: 'teacher-behavior.png', name: 'Teacher Behavior' },
        { label: 'שיעורי בית', file: 'teacher-homework.png', name: 'Teacher Homework' },
      ]},
    { role: 'STUDENT', phone: '0531111101', loginFile: 'student-login.png', dashFile: 'student-dashboard.png',
      navTests: [
        { label: 'טבלה', file: 'student-leaderboard.png', name: 'Student Leaderboard' },
        { label: 'שיעורי בית', file: 'student-homework.png', name: 'Student Homework' },
      ]},
    { role: 'PARENT', phone: '0502222201', loginFile: 'parent-login.png', dashFile: 'parent-dashboard.png',
      navTests: [
        { label: 'הודעות', file: 'parent-messages.png', name: 'Parent Messages' },
      ]},
    { role: 'ADMIN', phone: '0509999999', loginFile: 'admin-login.png', dashFile: 'admin-dashboard.png',
      navTests: [
        { label: 'כיתות', file: 'admin-stats.png', name: 'Admin Stats/Classes' },
      ]},
  ];

  for (const t of tests) {
    console.log(`\n=== ${t.role} ===`);
    try {
      const ctx = await browser.newContext({ locale: 'he-IL' });
      const page = await ctx.newPage();
      
      await loginWithPhone(page, t.phone, t.loginFile);
      log(`${t.role} Login`, 'PASS', t.loginFile);
      
      await page.screenshot({ path: path.join(QA_DIR, t.dashFile), fullPage: true });
      log(`${t.role} Dashboard`, 'PASS', t.dashFile);
      
      for (const nav of t.navTests) {
        if (await clickNav(page, nav.label)) {
          await page.screenshot({ path: path.join(QA_DIR, nav.file), fullPage: true });
          log(nav.name, 'PASS', nav.file);
        } else {
          await page.screenshot({ path: path.join(QA_DIR, nav.file), fullPage: true });
          log(nav.name, 'FAIL', nav.file, 'nav not found');
        }
      }
      
      await ctx.close();
    } catch (e) {
      log(`${t.role} Flow`, 'FAIL', '', e.message.split('\n')[0]);
    }
    // Wait between roles to avoid overwhelming the B1 app service
    await new Promise(r => setTimeout(r, 3000));
  }

  await browser.close();
  
  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  
  fs.writeFileSync(path.join(QA_DIR, 'results.json'), JSON.stringify(results, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
