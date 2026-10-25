import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:server',
      port: 8080,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: '8080',
        NODE_ENV: 'test',
        GEMINI_MOCK: 'true',
        ENABLE_SOLVER_PASS: 'false',
        CLIENT_ORIGIN: 'http://localhost:5173',
      },
    },
    {
      command: 'npm run dev --workspace=@mystery/client -- --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
