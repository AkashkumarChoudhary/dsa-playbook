import { defineConfig, devices } from '@playwright/test';

const channel = process.env.CI ? undefined : 'chrome';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/dsa-playbook/', channel },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/dsa-playbook/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel } }],
});
