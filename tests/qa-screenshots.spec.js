const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'qa-screenshots');

// Helper: demo login — seed once, then login
async function demoLogin(page, role) {
  const loginRes = await page.request.post('/api/auth/demo-login', { data: { role } });
  if (!loginRes.ok()) {
    // seed and retry
    await page.request.post('/api/demo/seed');
    const retryRes = await page.request.post('/api/auth/demo-login', { data: { role } });
    expect(retryRes.ok()).toBeTruthy();
    var { token, user } = await retryRes.json();
  } else {
    var { token, user } = await loginRes.json();
  }

  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('lerbox_token', token);
    localStorage.setItem('lerbox_user', JSON.stringify(user));
  }, { token, user });
  await page.reload();
  await expect(page.locator('#page-app')).toBeVisible({ timeout: 5000 });
  return user;
}

function ssPath(name, project) {
  return path.join(SCREENSHOTS_DIR, `${name}-${project}.png`);
}

test.describe('QA Screenshots', () => {

  test('landing page', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await page.goto('/');
    await expect(page.locator('.landing-logo')).toContainText('LerBox');
    await page.screenshot({ path: ssPath('01-landing', proj), fullPage: true });
  });

  test('login page', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await expect(page.locator('#page-login')).toBeVisible();
    await page.screenshot({ path: ssPath('02-login', proj), fullPage: true });
  });

  test('teacher dashboard', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.screenshot({ path: ssPath('03-teacher-dashboard', proj), fullPage: true });
  });

  test('teacher attendance', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.locator('.bottom-nav-item:has-text("נוכחות")').click();
    await expect(page.locator('#app-content')).toContainText('נוכחות', { timeout: 5000 });
    await page.screenshot({ path: ssPath('04-teacher-attendance', proj), fullPage: true });
  });

  test('teacher behavior', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.locator('.bottom-nav-item:has-text("התנהגות")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('05-teacher-behavior', proj), fullPage: true });
  });

  test('teacher homework', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.locator('.bottom-nav-item:has-text("שיעורי בית")').click();
    await expect(page.locator('#app-content')).toContainText('שיעורי בית', { timeout: 5000 });
    await page.screenshot({ path: ssPath('06-teacher-homework', proj), fullPage: true });
  });

  test('teacher announcements', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.locator('.bottom-nav-item:has-text("הודעות")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('07-teacher-announcements', proj), fullPage: true });
  });

  test('teacher chat', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    const chatBtn = page.locator('.bottom-nav-item:has-text("צ\'אט")');
    if (await chatBtn.count() > 0) {
      await chatBtn.click();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({ path: ssPath('08-teacher-chat', proj), fullPage: true });
  });

  test('student dashboard', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'student');
    await page.screenshot({ path: ssPath('09-student-dashboard', proj), fullPage: true });
  });

  test('student achievements', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'student');
    await page.locator('.bottom-nav-item:has-text("הישגים")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('10-student-achievements', proj), fullPage: true });
  });

  test('student leaderboard', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'student');
    await page.locator('.bottom-nav-item:has-text("טבלה")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('11-student-leaderboard', proj), fullPage: true });
  });

  test('parent dashboard', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'parent');
    await page.screenshot({ path: ssPath('12-parent-dashboard', proj), fullPage: true });
  });

  test('parent messages', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'parent');
    await page.locator('.bottom-nav-item:has-text("הודעות")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('13-parent-messages', proj), fullPage: true });
  });

  test('admin dashboard', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'admin');
    await page.screenshot({ path: ssPath('14-admin-dashboard', proj), fullPage: true });
  });

  test('admin settings', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'admin');
    await page.locator('.bottom-nav-item:has-text("הגדרות")').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: ssPath('15-admin-settings', proj), fullPage: true });
  });

  test('logout flow', async ({ page }, testInfo) => {
    const proj = testInfo.project.name;
    await demoLogin(page, 'teacher');
    await page.locator('button:has-text("יציאה")').click();
    await expect(page.locator('#page-landing')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: ssPath('16-after-logout', proj), fullPage: true });
  });
});
