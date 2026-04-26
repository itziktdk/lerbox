const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
  },
  globalSetup: './tests/global-setup.js',
  globalTeardown: './tests/global-teardown.js',
});
