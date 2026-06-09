import { Client } from 'pg'
import { expect, type Page, type APIRequestContext } from '@playwright/test'

export const ADMIN_NAME     = process.env.SEED_ADMIN_NAME!
export const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL!
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD!
export const AGENT_NAME     = process.env.SEED_AGENT_NAME!
export const AGENT_EMAIL    = process.env.SEED_AGENT_EMAIL!
export const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD!

async function loginInContext(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  const loginPage = await page.context().newPage()
  await loginPage.goto('/login')
  await loginPage.getByLabel('Email').fill(credentials.email)
  await loginPage.getByLabel('Password').fill(credentials.password)
  await loginPage.getByRole('button', { name: 'Sign in' }).click()
  await expect(loginPage).toHaveURL('/')
  await loginPage.close()
}

export const loginAsAdmin = (page: Page) =>
  loginInContext(page, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

export const loginAsAgent = (page: Page) =>
  loginInContext(page, { email: AGENT_EMAIL, password: AGENT_PASSWORD })

export async function seedTicket(
  request: APIRequestContext,
  overrides: { from: string; fromName: string; subject: string; body?: string; htmlBody?: string }
) {
  const response = await request.post(
    `${process.env.BETTER_AUTH_URL!}/api/webhooks/inbound-email`,
    {
      headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET! },
      data: { body: 'Test body.', ...overrides },
    }
  )

  if (!response.ok()) {
    throw new Error(`Failed to seed ticket: ${response.status()} ${await response.text()}`)
  }

  return response.json() as Promise<{
    id: number
    fromEmail: string
    fromName: string
    subject: string
    status: string
    category: string | null
    assignedToId: string | null
    createdAt: string
    updatedAt: string
  }>
}

export type SeededTicket = Awaited<ReturnType<typeof seedTicket>>

export async function setTicketFields(updates: Array<{ id: number; status: string; category: string | null }>) {
  const db = new Client({ connectionString: process.env.DATABASE_URL! })
  await db.connect()
  for (const { id, status, category } of updates) {
    await db.query(`UPDATE "ticket" SET status = $1, category = $2 WHERE id = $3`, [status, category, id])
  }
  await db.end()
}
