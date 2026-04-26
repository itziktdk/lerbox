const { test, expect } = require('@playwright/test');

const BASE = 'https://lerbox-app.azurewebsites.net';
const ROLES = [
  { name: 'teacher', phone: '0501111111' },
  { name: 'parent', phone: '0502222201' },
  { name: 'admin', phone: '0509999999' },
];

test.describe('Performance QA', () => {
  test('Landing page loads fast', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    const elapsed = Date.now() - start;
    console.log(`Landing page: ${elapsed}ms`);
    await page.screenshot({ path: 'qa-performance/landing.png', fullPage: true });
    expect(elapsed).toBeLessThan(5000);
  });

  for (const role of ROLES) {
    test(`Login and dashboard - ${role.name}`, async ({ page }) => {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Click login button
      const loginBtn = page.locator('text=כניסה למערכת').first();
      if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await loginBtn.click();
      }
      
      // Wait for login form
      await page.waitForTimeout(500);
      
      // Try demo login
      const demoBtn = page.locator(`text=כניסת דמו`).first();
      if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await demoBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Select role for demo
      const roleBtn = page.locator(`button:has-text("${role.name === 'teacher' ? 'מורה' : role.name === 'parent' ? 'הורה' : 'מנהל'}")`).first();
      if (await roleBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const start = Date.now();
        await roleBtn.click();
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);
        const elapsed = Date.now() - start;
        console.log(`${role.name} dashboard: ${elapsed}ms`);
        await page.screenshot({ path: `qa-performance/${role.name}-dashboard.png`, fullPage: true });
        expect(elapsed).toBeLessThan(5000);
      } else {
        // Try phone login
        const phoneInput = page.locator('input[type="tel"], input[placeholder*="טלפון"]').first();
        if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await phoneInput.fill(role.phone);
          await page.locator('button:has-text("שלח")').first().click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `qa-performance/${role.name}-login.png`, fullPage: true });
        }
      }
    });
  }
});
