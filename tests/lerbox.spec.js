const { test, expect } = require('@playwright/test');

// Helper: demo login via API and inject into browser
async function demoLogin(page, role) {
  const seedRes = await page.request.post('/api/demo/seed');
  expect(seedRes.ok()).toBeTruthy();
  const loginRes = await page.request.post('/api/auth/demo-login', { data: { role } });
  expect(loginRes.ok()).toBeTruthy();
  const { token, user } = await loginRes.json();

  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('lerbox_token', token);
    localStorage.setItem('lerbox_user', JSON.stringify(user));
  }, { token, user });
  await page.reload();
  await expect(page.locator('#page-app')).toBeVisible({ timeout: 5000 });
  return user;
}

// ========================
// 1. Landing & Login Page
// ========================
test.describe('Landing & Auth', () => {
  test('landing page loads with LerBox branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.landing-logo')).toContainText('LerBox');
    await expect(page.locator('.landing-hero h1')).toBeVisible();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await expect(page.locator('#page-login')).toBeVisible();
  });

  test('demo login as teacher via UI works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await page.locator('.demo-role-btn:has-text("מורה")').click();
    await expect(page.locator('#page-app')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#header-role')).toContainText('מורה');
  });

  test('demo login as student via UI works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await page.locator('.demo-role-btn:has-text("תלמיד")').click();
    await expect(page.locator('#page-app')).toBeVisible({ timeout: 15000 });
  });

  test('demo login as parent via UI works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await page.locator('.demo-role-btn:has-text("הורה")').click();
    await expect(page.locator('#page-app')).toBeVisible({ timeout: 15000 });
  });

  test('demo login as admin via UI works', async ({ page }) => {
    await page.goto('/');
    await page.locator('.landing-cta').first().click();
    await page.locator('.demo-role-btn:has-text("מנהל")').click();
    await expect(page.locator('#page-app')).toBeVisible({ timeout: 15000 });
  });
});

// ========================
// 2. Teacher Dashboard
// ========================
test.describe('Teacher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await demoLogin(page, 'teacher');
  });

  test('shows teacher name in header', async ({ page }) => {
    await expect(page.locator('#header-name')).toContainText('מיכל');
  });

  test('shows role as מורה', async ({ page }) => {
    await expect(page.locator('#header-role')).toContainText('מורה');
  });

  test('bottom nav has correct items', async ({ page }) => {
    const nav = page.locator('#bottom-nav');
    await expect(nav).toContainText('נוכחות');
    await expect(nav).toContainText('התנהגות');
    await expect(nav).toContainText('שיעורי בית');
  });

  test('can navigate to attendance', async ({ page }) => {
    await page.locator('.bottom-nav-item:has-text("נוכחות")').click();
    await expect(page.locator('#app-content')).toContainText('נוכחות', { timeout: 5000 });
  });

  test('can navigate to behavior', async ({ page }) => {
    await page.locator('.bottom-nav-item:has-text("התנהגות")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#app-content')).toBeVisible();
  });

  test('can navigate to homework', async ({ page }) => {
    await page.locator('.bottom-nav-item:has-text("שיעורי בית")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#app-content')).toContainText('שיעורי בית', { timeout: 5000 });
  });

  test('can navigate to announcements', async ({ page }) => {
    await page.locator('.bottom-nav-item:has-text("הודעות")').click();
    await page.waitForTimeout(1000);
  });
});

// ========================
// 3. Attendance Flow
// ========================
test.describe('Attendance', () => {
  test('teacher sees student list for attendance', async ({ page }) => {
    await demoLogin(page, 'teacher');
    await page.locator('.bottom-nav-item:has-text("נוכחות")').click();
    await page.waitForTimeout(1500);
    await expect(page.locator('#app-content')).toContainText('נועם');
  });
});

// ========================
// 4. Student Dashboard
// ========================
test.describe('Student Dashboard', () => {
  test('shows student name', async ({ page }) => {
    await demoLogin(page, 'student');
    await expect(page.locator('#header-name')).toContainText('נועם');
  });

  test('shows points section', async ({ page }) => {
    await demoLogin(page, 'student');
    await expect(page.locator('#app-content')).toContainText('נקודות');
  });

  test('student nav has achievements tab', async ({ page }) => {
    await demoLogin(page, 'student');
    await expect(page.locator('#bottom-nav')).toContainText('הישגים');
  });

  test('student can view leaderboard', async ({ page }) => {
    await demoLogin(page, 'student');
    await page.locator('.bottom-nav-item:has-text("טבלה")').click();
    await page.waitForTimeout(1000);
  });
});

// ========================
// 5. Parent Dashboard
// ========================
test.describe('Parent Dashboard', () => {
  test('shows parent name', async ({ page }) => {
    await demoLogin(page, 'parent');
    await expect(page.locator('#header-name')).toContainText('רונית');
  });

  test('parent nav has messages tab', async ({ page }) => {
    await demoLogin(page, 'parent');
    await expect(page.locator('#bottom-nav')).toContainText('הודעות');
  });
});

// ========================
// 6. Admin Dashboard
// ========================
test.describe('Admin Dashboard', () => {
  test('shows admin name', async ({ page }) => {
    await demoLogin(page, 'admin');
    await expect(page.locator('#header-name')).toContainText('דנה');
  });

  test('admin nav has settings', async ({ page }) => {
    await demoLogin(page, 'admin');
    await expect(page.locator('#bottom-nav')).toContainText('הגדרות');
  });
});

// ========================
// 7. Logout
// ========================
test.describe('Logout', () => {
  test('logout returns to landing', async ({ page }) => {
    await demoLogin(page, 'teacher');
    await page.locator('button:has-text("יציאה")').click();
    await expect(page.locator('#page-landing')).toBeVisible({ timeout: 5000 });
  });
});

// ========================
// 8. API Tests
// ========================
test.describe('API', () => {
  test('POST /api/demo/seed returns login info', async ({ request }) => {
    const res = await request.post('/api/demo/seed');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.logins.teacher.phone).toBeDefined();
    expect(data.logins.student.phone).toBeDefined();
    expect(data.logins.parent.phone).toBeDefined();
    expect(data.logins.admin.phone).toBeDefined();
  });

  test('demo-login returns token and user', async ({ request }) => {
    await request.post('/api/demo/seed');
    const res = await request.post('/api/auth/demo-login', { data: { role: 'teacher' } });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.token).toBeTruthy();
    expect(data.user.role).toBe('teacher');
    expect(data.user.name).toBe('מיכל לוי');
  });

  test('GET /api/auth/me rejects without token', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
  });

  test('GET /api/auth/me works with valid token', async ({ request }) => {
    await request.post('/api/demo/seed');
    const loginRes = await request.post('/api/auth/demo-login', { data: { role: 'teacher' } });
    const { token } = await loginRes.json();
    const res = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.user.role).toBe('teacher');
  });

  test('OTP send + verify flow', async ({ request }) => {
    await request.post('/api/demo/seed');
    // Send OTP to known teacher phone
    const otpRes = await request.post('/api/auth/send-otp', {
      data: { phone: '0501234567' },
    });
    expect(otpRes.ok()).toBeTruthy();
    const { code } = await otpRes.json();
    expect(code).toBeTruthy();

    // Verify OTP
    const verifyRes = await request.post('/api/auth/verify-otp', {
      data: { phone: '0501234567', code },
    });
    expect(verifyRes.ok()).toBeTruthy();
    const verifyData = await verifyRes.json();
    expect(verifyData.token).toBeTruthy();
    expect(verifyData.user.role).toBe('teacher');
  });

  test('OTP with wrong code fails', async ({ request }) => {
    await request.post('/api/demo/seed');
    await request.post('/api/auth/send-otp', { data: { phone: '0501234567' } });
    const res = await request.post('/api/auth/verify-otp', {
      data: { phone: '0501234567', code: '0000' },
    });
    expect(res.status()).toBe(401);
  });

  test('send-otp to unknown phone fails', async ({ request }) => {
    await request.post('/api/demo/seed');
    const res = await request.post('/api/auth/send-otp', {
      data: { phone: '0599999999' },
    });
    expect(res.status()).toBe(404);
  });
});
