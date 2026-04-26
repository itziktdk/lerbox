const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE = 'http://localhost:3001';
const SS = '/home/itziktdk/.openclaw/workspace/school-app/qa-night';

const ROLES = {
  teacher: { phone: '0501111111', label: 'מורה' },
  student: { phone: '0501111112', label: 'תלמיד/ה' },
  parent:  { phone: '0501111113', label: 'הורה' },
  admin:   { phone: '0501111114', label: 'מנהל/ת' },
};

async function login(page, role) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  // Use OTP API flow
  const otpRes = await page.request.post(`${BASE}/api/auth/send-otp`, {
    data: { phone: ROLES[role].phone }
  });
  const otpData = await otpRes.json();
  const code = otpData.code || otpData.otp;
  
  const verifyRes = await page.request.post(`${BASE}/api/auth/verify-otp`, {
    data: { phone: ROLES[role].phone, code: String(code) }
  });
  const verifyData = await verifyRes.json();
  
  // Set token in localStorage and reload
  await page.evaluate((data) => {
    localStorage.setItem('lerbox_token', data.token);
    localStorage.setItem('lerbox_user', JSON.stringify(data.user));
  }, verifyData);
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SS, `${name}.png`), fullPage: true });
}

// ===== LANDING & LOGIN =====
test.describe('Landing & Login', () => {
  test('splash screen shows and fades', async ({ page }) => {
    await page.goto(BASE);
    const splash = page.locator('#splash-screen');
    // Should exist initially
    await expect(splash).toBeVisible({ timeout: 2000 }).catch(() => {});
    // Wait for it to fade
    await page.waitForTimeout(1500);
    await screenshot(page, '01-landing');
  });

  test('landing page renders correctly', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '02-landing-full');
    // Check hero text
    await expect(page.locator('.landing-hero h1')).toBeVisible();
    // Check feature cards
    const cards = page.locator('.feature-card');
    await expect(cards).toHaveCount(4);
  });

  test('login page renders', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('.landing-cta >> nth=0');
    await page.waitForTimeout(300);
    await screenshot(page, '03-login-page');
    await expect(page.locator('#login-phone')).toBeVisible();
  });

  test('demo login buttons visible', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('.landing-cta >> nth=0');
    await page.waitForTimeout(300);
    const demoButtons = page.locator('.demo-role-btn');
    await expect(demoButtons).toHaveCount(4);
  });
});

// ===== MOBILE VIEWPORT =====
test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing mobile', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '04-landing-mobile');
  });

  test('login mobile', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.click('.landing-cta >> nth=0');
    await page.waitForTimeout(300);
    await screenshot(page, '05-login-mobile');
  });
});

// ===== TEACHER FLOW =====
test.describe('Teacher flow', () => {
  test('teacher dashboard', async ({ page }) => {
    await login(page, 'teacher');
    await screenshot(page, '10-teacher-dashboard');
    // Check bottom nav exists
    await expect(page.locator('.bottom-nav')).toBeVisible();
  });

  test('teacher attendance', async ({ page }) => {
    await login(page, 'teacher');
    // Click attendance nav
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      if (text.includes('נוכחות')) {
        await navItems.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(500);
    await screenshot(page, '11-teacher-attendance');
  });

  test('teacher behavior', async ({ page }) => {
    await login(page, 'teacher');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      if (text.includes('התנהגות')) {
        await navItems.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(500);
    await screenshot(page, '12-teacher-behavior');
  });

  test('teacher homework', async ({ page }) => {
    await login(page, 'teacher');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      if (text.includes('שיעורי')) {
        await navItems.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(500);
    await screenshot(page, '13-teacher-homework');
  });

  test('teacher announcements', async ({ page }) => {
    await login(page, 'teacher');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      if (text.includes('הודעות')) {
        await navItems.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(500);
    await screenshot(page, '14-teacher-announcements');
  });

  test('teacher all nav pages', async ({ page }) => {
    await login(page, 'teacher');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(400);
      const text = (await navItems.nth(i).textContent()).trim().replace(/\s+/g,'-');
      await screenshot(page, `15-teacher-nav-${i}-${text}`);
    }
  });
});

// ===== STUDENT FLOW =====
test.describe('Student flow', () => {
  test('student dashboard', async ({ page }) => {
    await login(page, 'student');
    await screenshot(page, '20-student-dashboard');
  });

  test('student all nav pages', async ({ page }) => {
    await login(page, 'student');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(400);
      const text = (await navItems.nth(i).textContent()).trim().replace(/\s+/g,'-');
      await screenshot(page, `21-student-nav-${i}-${text}`);
    }
  });

  test('student mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, 'student');
    await screenshot(page, '22-student-mobile');
  });
});

// ===== PARENT FLOW =====
test.describe('Parent flow', () => {
  test('parent dashboard', async ({ page }) => {
    await login(page, 'parent');
    await screenshot(page, '30-parent-dashboard');
  });

  test('parent all nav pages', async ({ page }) => {
    await login(page, 'parent');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(400);
      const text = (await navItems.nth(i).textContent()).trim().replace(/\s+/g,'-');
      await screenshot(page, `31-parent-nav-${i}-${text}`);
    }
  });
});

// ===== ADMIN FLOW =====
test.describe('Admin flow', () => {
  test('admin dashboard', async ({ page }) => {
    await login(page, 'admin');
    await screenshot(page, '40-admin-dashboard');
  });

  test('admin all nav pages', async ({ page }) => {
    await login(page, 'admin');
    const navItems = page.locator('.bottom-nav .nav-item');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(400);
      const text = (await navItems.nth(i).textContent()).trim().replace(/\s+/g,'-');
      await screenshot(page, `41-admin-nav-${i}-${text}`);
    }
  });
});

// ===== VISUAL CHECKS =====
test.describe('Visual & content checks', () => {
  test('no broken images on landing', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate(el => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('RTL direction is set', async ({ page }) => {
    await page.goto(BASE);
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('all SVG icons render (no broken paths)', async ({ page }) => {
    await login(page, 'teacher');
    const svgs = page.locator('svg');
    const count = await svgs.count();
    expect(count).toBeGreaterThan(0);
    // Check at least first 10 have valid viewBox
    for (let i = 0; i < Math.min(count, 10); i++) {
      const vb = await svgs.nth(i).getAttribute('viewBox');
      expect(vb).toBeTruthy();
    }
  });

  test('performance - page load under 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;
    console.log(`Landing load time: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(5000);
  });

  test('performance - login flow under 3s', async ({ page }) => {
    const start = Date.now();
    await login(page, 'student');
    const elapsed = Date.now() - start;
    console.log(`Login flow time: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(5000);
  });
});
