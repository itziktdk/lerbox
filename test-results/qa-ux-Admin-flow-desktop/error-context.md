# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa-ux.spec.js >> Admin flow
- Location: tests/qa-ux.spec.js:76:1

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "https://lerbox-app.azurewebsites.net/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | const BASE = 'https://lerbox-app.azurewebsites.net';
  4  | const QA_DIR = '/home/itziktdk/.openclaw/workspace/school-app/qa-ux';
  5  | 
  6  | // Seed once
  7  | let tokens = {};
  8  | test.beforeAll(async ({ request }) => {
  9  |   // Data should already be seeded. If not, seed now.
  10 |   try {
  11 |     const checkRes = await request.post(`${BASE}/api/auth/demo-login`, { data: { role: 'teacher' } });
  12 |     if (!checkRes.ok()) throw new Error('no data');
  13 |     tokens.teacher = await checkRes.json();
  14 |   } catch {
  15 |     await request.post(`${BASE}/api/demo/seed`, { timeout: 120000 });
  16 |     const tr = await request.post(`${BASE}/api/auth/demo-login`, { data: { role: 'teacher' } });
  17 |     tokens.teacher = await tr.json();
  18 |   }
  19 |   for (const role of ['student', 'parent', 'admin']) {
  20 |     const res = await request.post(`${BASE}/api/auth/demo-login`, { data: { role } });
  21 |     tokens[role] = await res.json();
  22 |   }
  23 | });
  24 | 
  25 | async function loginAs(page, role) {
> 26 |   await page.goto(BASE, { timeout: 30000, waitUntil: 'domcontentloaded' });
     |              ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  27 |   await page.evaluate((d) => {
  28 |     localStorage.setItem('lerbox_token', d.token);
  29 |     localStorage.setItem('lerbox_user', JSON.stringify(d.user));
  30 |   }, tokens[role]);
  31 |   await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  32 |   await page.waitForSelector('#app-content', { timeout: 15000 });
  33 |   await page.waitForTimeout(2000);
  34 | }
  35 | 
  36 | test('Landing page', async ({ page }) => {
  37 |   await page.goto(BASE);
  38 |   await page.waitForTimeout(2000);
  39 |   await page.screenshot({ path: `${QA_DIR}/landing.png`, fullPage: true });
  40 |   await page.locator('button:has-text("כניסה למערכת")').first().click();
  41 |   await page.waitForTimeout(1000);
  42 |   await page.screenshot({ path: `${QA_DIR}/login.png`, fullPage: true });
  43 | });
  44 | 
  45 | test('Teacher flow', async ({ page }) => {
  46 |   await loginAs(page, 'teacher');
  47 |   await page.screenshot({ path: `${QA_DIR}/teacher-home.png`, fullPage: true });
  48 |   for (const nav of ['attendance', 'behavior', 'homework', 'messages', 'announcements']) {
  49 |     await page.locator(`[data-nav="${nav}"]`).click();
  50 |     await page.waitForTimeout(2500);
  51 |     await page.screenshot({ path: `${QA_DIR}/teacher-${nav}.png`, fullPage: true });
  52 |   }
  53 | });
  54 | 
  55 | test('Student flow', async ({ page }) => {
  56 |   await loginAs(page, 'student');
  57 |   await page.screenshot({ path: `${QA_DIR}/student-home.png`, fullPage: true });
  58 |   for (const nav of ['homework', 'achievements', 'leaderboard', 'announcements']) {
  59 |     const btn = page.locator(`[data-nav="${nav}"]`);
  60 |     if (await btn.count() > 0) {
  61 |       await btn.click();
  62 |       await page.waitForTimeout(2500);
  63 |       await page.screenshot({ path: `${QA_DIR}/student-${nav}.png`, fullPage: true });
  64 |     }
  65 |   }
  66 | });
  67 | 
  68 | test('Parent flow', async ({ page }) => {
  69 |   await loginAs(page, 'parent');
  70 |   await page.screenshot({ path: `${QA_DIR}/parent-home.png`, fullPage: true });
  71 |   await page.locator('[data-nav="messages"]').click();
  72 |   await page.waitForTimeout(2500);
  73 |   await page.screenshot({ path: `${QA_DIR}/parent-messages.png`, fullPage: true });
  74 | });
  75 | 
  76 | test('Admin flow', async ({ page }) => {
  77 |   await loginAs(page, 'admin');
  78 |   await page.screenshot({ path: `${QA_DIR}/admin-home.png`, fullPage: true });
  79 |   for (const nav of ['admin-classes', 'admin-users', 'announcements']) {
  80 |     await page.locator(`[data-nav="${nav}"]`).click();
  81 |     await page.waitForTimeout(2500);
  82 |     await page.screenshot({ path: `${QA_DIR}/admin-${nav}.png`, fullPage: true });
  83 |   }
  84 | });
  85 | 
```