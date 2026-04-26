const { test, expect } = require('@playwright/test');

const BASE = 'https://lerbox-app.azurewebsites.net';
const QA_DIR = '/home/itziktdk/.openclaw/workspace/school-app/qa-ux';

// Seed once
let tokens = {};
test.beforeAll(async ({ request }) => {
  // Data should already be seeded. If not, seed now.
  try {
    const checkRes = await request.post(`${BASE}/api/auth/demo-login`, { data: { role: 'teacher' } });
    if (!checkRes.ok()) throw new Error('no data');
    tokens.teacher = await checkRes.json();
  } catch {
    await request.post(`${BASE}/api/demo/seed`, { timeout: 120000 });
    const tr = await request.post(`${BASE}/api/auth/demo-login`, { data: { role: 'teacher' } });
    tokens.teacher = await tr.json();
  }
  for (const role of ['student', 'parent', 'admin']) {
    const res = await request.post(`${BASE}/api/auth/demo-login`, { data: { role } });
    tokens[role] = await res.json();
  }
});

async function loginAs(page, role) {
  await page.goto(BASE, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.evaluate((d) => {
    localStorage.setItem('lerbox_token', d.token);
    localStorage.setItem('lerbox_user', JSON.stringify(d.user));
  }, tokens[role]);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#app-content', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

test('Landing page', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${QA_DIR}/landing.png`, fullPage: true });
  await page.locator('button:has-text("כניסה למערכת")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${QA_DIR}/login.png`, fullPage: true });
});

test('Teacher flow', async ({ page }) => {
  await loginAs(page, 'teacher');
  await page.screenshot({ path: `${QA_DIR}/teacher-home.png`, fullPage: true });
  for (const nav of ['attendance', 'behavior', 'homework', 'messages', 'announcements']) {
    await page.locator(`[data-nav="${nav}"]`).click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${QA_DIR}/teacher-${nav}.png`, fullPage: true });
  }
});

test('Student flow', async ({ page }) => {
  await loginAs(page, 'student');
  await page.screenshot({ path: `${QA_DIR}/student-home.png`, fullPage: true });
  for (const nav of ['homework', 'achievements', 'leaderboard', 'announcements']) {
    const btn = page.locator(`[data-nav="${nav}"]`);
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${QA_DIR}/student-${nav}.png`, fullPage: true });
    }
  }
});

test('Parent flow', async ({ page }) => {
  await loginAs(page, 'parent');
  await page.screenshot({ path: `${QA_DIR}/parent-home.png`, fullPage: true });
  await page.locator('[data-nav="messages"]').click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${QA_DIR}/parent-messages.png`, fullPage: true });
});

test('Admin flow', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.screenshot({ path: `${QA_DIR}/admin-home.png`, fullPage: true });
  for (const nav of ['admin-classes', 'admin-users', 'announcements']) {
    await page.locator(`[data-nav="${nav}"]`).click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${QA_DIR}/admin-${nav}.png`, fullPage: true });
  }
});
