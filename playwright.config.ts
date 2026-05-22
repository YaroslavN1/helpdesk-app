import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.test' })

const SERVER_PORT = 3001
const CLIENT_PORT = 5174

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const TEST_BETTER_AUTH_SECRET = process.env.TEST_BETTER_AUTH_SECRET

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun --hot src/index.ts',
      cwd: path.join(__dirname, 'server'),
      url: `http://localhost:${SERVER_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: TEST_DATABASE_URL!,
        BETTER_AUTH_SECRET: TEST_BETTER_AUTH_SECRET!,
        BETTER_AUTH_URL: `http://localhost:${SERVER_PORT}`,
        TRUSTED_ORIGIN: `http://localhost:${CLIENT_PORT}`,
        PORT: String(SERVER_PORT),
        NODE_ENV: 'test',
      },
    },
    {
      command: 'bunx vite',
      cwd: path.join(__dirname, 'client'),
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
