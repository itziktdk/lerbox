const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  workers: 1,
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
});
