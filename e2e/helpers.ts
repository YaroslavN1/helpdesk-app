import { expect, type Page } from '@playwright/test'

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
