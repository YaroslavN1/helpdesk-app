import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.test' })

const SERVER_PORT = 3001
const CLIENT_PORT = 5174

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
      command: 'bun src/index.ts',
      cwd: path.join(__dirname, 'server'),
      url: `http://localhost:${SERVER_PORT}/api/health`,
      reuseExistingServer: false,
      env: {
        PORT: String(SERVER_PORT),
        NODE_ENV: 'test',
      },
    },
    {
      command: `bunx vite --port ${CLIENT_PORT}`,
      cwd: path.join(__dirname, 'client'),
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
