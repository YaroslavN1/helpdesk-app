import { execSync } from 'child_process'
import { Client } from 'pg'
import path from 'path'

const SERVER_DIR = path.join(__dirname, '../server')

export default async function globalSetup() {
  validateEnvVariables()

  const testDbUrl = process.env.TEST_DATABASE_URL!
  const testAuthSecret = process.env.TEST_BETTER_AUTH_SECRET!

  console.log('[global-setup] Creating test database...')
  await createTestDatabaseIfNeeded(testDbUrl)
  runMigrations(testDbUrl)

  console.log('[global-setup] Resetting test database...')
  await resetDatabase(testDbUrl)

  console.log('[global-setup] Seeding test database...')
  seedAdminUser(testDbUrl, testAuthSecret)
  seedAgentUser(testDbUrl, testAuthSecret)
  console.log('[global-setup] Test database ready.')
}

function validateEnvVariables() {
  const required = [
    'TEST_DATABASE_URL',
    'TEST_BETTER_AUTH_SECRET',
    'TEST_SEED_ADMIN_EMAIL',
    'TEST_SEED_ADMIN_PASSWORD',
  ]
  const missingVariables = required.filter(k => !process.env[k])
  if (missingVariables.length) {
    throw new Error(
      `E2E setup is missing required env vars: ${missingVariables.join(', ')}.\nEnsure .env.test exists at the project root.`
    )
  }
}

async function createTestDatabaseIfNeeded(testDbUrl: string) {
  const adminUrl = testDbUrl.replace(/\/helpdesk_test(\?.*)?$/, '/postgres$1')
  const client = new Client({ connectionString: adminUrl })
  await client.connect()
  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'helpdesk_test'"
  )
  if (!rows.length) {
    await client.query('CREATE DATABASE helpdesk_test')
    console.log('[global-setup] Created test database helpdesk_test')
  }
  await client.end()
}

function runMigrations(testDbUrl: string) {
  execSync('bunx prisma migrate deploy', {
    cwd: SERVER_DIR,
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  })
}

async function resetDatabase(testDbUrl: string) {
  const client = new Client({ connectionString: testDbUrl })
  await client.connect()
  await client.query(
    'TRUNCATE TABLE "session", "account", "verification", "user" CASCADE'
  )
  await client.end()
}

function seedAdminUser(testDbUrl: string, testAuthSecret: string) {
  execSync('bun src/seed-admin.ts', {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      DATABASE_URL: testDbUrl,
      BETTER_AUTH_SECRET: testAuthSecret,
      BETTER_AUTH_URL: 'http://localhost:3000',
      TRUSTED_ORIGIN: 'http://localhost:5173',
      SEED_ADMIN_EMAIL: process.env.TEST_SEED_ADMIN_EMAIL!,
      SEED_ADMIN_PASSWORD: process.env.TEST_SEED_ADMIN_PASSWORD!,
    },
    stdio: 'inherit',
  })
}

function seedAgentUser(testDbUrl: string, testAuthSecret: string) {
  execSync('bun src/seed-agent.ts', {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      DATABASE_URL: testDbUrl,
      BETTER_AUTH_SECRET: testAuthSecret,
      BETTER_AUTH_URL: 'http://localhost:3000',
      TRUSTED_ORIGIN: 'http://localhost:5173',
      SEED_AGENT_EMAIL: 'agent@test.com',
      SEED_AGENT_PASSWORD: 'AgentPass1!',
      SEED_AGENT_NAME: 'Test Agent',
    },
    stdio: 'inherit',
  })
}
