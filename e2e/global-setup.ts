import { execSync } from 'child_process'
import { Client } from 'pg'
import path from 'path'

const SERVER_DIR = path.join(__dirname, '../server')

export default async function globalSetup() {
  validateEnvVariables()

  const testDbUrl = process.env.DATABASE_URL!

  console.log('[global-setup] Preparing test database...')

  await createTestDatabase(testDbUrl)
  runMigrations()
  await resetTestDatabase(testDbUrl)
  seedAdminUser()
  seedAgentUser()

  console.log('[global-setup] Test database ready.')
}

function validateEnvVariables() {
  const required = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'SEED_ADMIN_EMAIL',
    'SEED_ADMIN_PASSWORD',
    'SEED_AGENT_EMAIL',
    'SEED_AGENT_PASSWORD',
  ]
  const missingVariables = required.filter(k => !process.env[k])
  if (missingVariables.length) {
    throw new Error(
      `E2E setup is missing required env vars: ${missingVariables.join(', ')}.\nEnsure .env.test exists at the project root.`
    )
  }
}

async function createTestDatabase(testDbUrl: string) {
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

async function resetTestDatabase(testDbUrl: string) {
  const client = new Client({ connectionString: testDbUrl })
  await client.connect()
  await client.query(
    'TRUNCATE TABLE "ticket", "session", "account", "verification", "user" CASCADE'
  )
  await client.end()
}

function runMigrations() {
  execSync('bunx prisma migrate deploy', {
    cwd: SERVER_DIR,
    stdio: 'inherit',
  })
}

function seedAdminUser() {
  execSync('bun src/seed-admin.ts', { cwd: SERVER_DIR, stdio: 'inherit' })
}

function seedAgentUser() {
  execSync('bun src/seed-agent.ts', { cwd: SERVER_DIR, stdio: 'inherit' })
}
