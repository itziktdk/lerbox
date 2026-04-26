const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  globalTimeout: 600000,
  retries: 0,
  workers: 1,
  outputDir: './test-results',
  use: {
    baseURL: 'https://lerbox-app.azurewebsites.net',
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
  ],
});
