// Browser tests run against the PRODUCTION build (vite build + vite preview) and the real /api code,
// on their own ports with a throwaway in-memory database — your .data/pglite and Neon are never touched.
import { defineConfig, devices } from '@playwright/test'

const API_PORT = 3101
const WEB_PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // iPhone 13 screen size, touch and user agent — rendered with Chromium
    { name: 'mobile-iphone', use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node server/dev-api.js',
      url: `http://localhost:${API_PORT}/api/stats`,
      env: { API_PORT: String(API_PORT), PULSEFIT_DB_DIR: 'memory', DATABASE_URL: '', JWT_SECRET: 'playwright-only-secret-0123456789abcdef' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
