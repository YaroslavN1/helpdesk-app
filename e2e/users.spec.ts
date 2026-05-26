import { test, expect, type BrowserContext } from '@playwright/test'

// ---------------------------------------------------------------------------
// Constants — pulled from .env.test (loaded by playwright.config.ts)
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD!

const AGENT_EMAIL = process.env.SEED_AGENT_EMAIL!
const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD!
const AGENT_NAME = process.env.SEED_AGENT_NAME!

const SERVER_BASE_URL = 'http://localhost:3001'

/**
 * Performs a real browser login for `credentials` inside `context`, then
 * closes the page.  Subsequent pages opened from the same context will carry
 * the auth cookie automatically.
 */
async function loginInContext(
  context: BrowserContext,
  credentials: { email: string; password: string }
): Promise<void> {
  const page = await context.newPage()
  await page.goto('/login')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')
  await page.close()
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('Users page', () => {
  // -------------------------------------------------------------------------
  // Table structure and content
  // -------------------------------------------------------------------------

  test.describe('Table rendering', () => {
    test('renders all four column headers', async ({ page, context }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')
      await expect(page).toHaveURL('/users')

      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()
    })

    test('shows both seeded users (admin + agent) in the table', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      // The table body should contain one row per seeded user.
      // We assert by email, which is a stable unique identifier.
      await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).toBeVisible()
      await expect(page.getByRole('cell', { name: AGENT_EMAIL })).toBeVisible()
    })

    test('admin row displays "admin" badge and agent row displays "agent" badge', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      // Each role badge contains the role text. There are exactly two seeded
      // users, so we can assert both badge texts are present.
      await expect(page.getByRole('cell').filter({ hasText: /^admin$/ })).toBeVisible()
      await expect(page.getByRole('cell').filter({ hasText: /^agent$/ })).toBeVisible()
    })

    test('admin and agent badges are visually distinct (different aria roles / variants)', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      // The shadcn Badge renders with data-slot="badge". The variant is
      // reflected in its class: 'default' variant uses bg-primary; 'secondary'
      // variant uses bg-secondary. We check that the two role badges do not
      // share the same class string, confirming visual distinction.
      const adminBadge = page.getByRole('cell').filter({ hasText: /^admin$/ }).locator('[data-slot="badge"]')
      const agentBadge = page.getByRole('cell').filter({ hasText: /^agent$/ }).locator('[data-slot="badge"]')

      const adminClass = await adminBadge.getAttribute('class')
      const agentClass = await agentBadge.getAttribute('class')

      expect(adminClass).not.toEqual(agentClass)
    })

    test('agent name appears in the table', async ({ page, context }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      await expect(page.getByRole('cell', { name: AGENT_NAME })).toBeVisible()
    })

    test('Joined column shows a human-readable date string for each row', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      // UsersPage formats dates with toLocaleDateString('en-US', { year, month, day })
      // which produces strings like "May 22, 2026". We check that at least one
      // cell matches that pattern.
      const dateCells = page.getByRole('cell').filter({ hasText: /[A-Z][a-z]{2} \d{1,2}, \d{4}/ })
      await expect(dateCells.first()).toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  test.describe('Loading state', () => {
    test('shows skeleton rows while the API request is in flight', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      // Delay the /api/users response so we can observe the loading state.
      await page.route('**/api/users', async route => {
        await new Promise<void>(resolve => setTimeout(resolve, 600))
        await route.continue()
      })

      await page.goto('/users')

      // During loading the skeleton table is rendered — the table is visible
      // but contains no real user data (no email cells).
      await expect(page.getByRole('table')).toBeVisible()
      await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).not.toBeVisible()
    })

    test('table shows real data after the API request completes', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')

      // Wait for actual user data to appear — this confirms loading is done.
      await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  test.describe('Error state', () => {
    test('shows an error message when the API returns a server error', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.route('**/api/users', route =>
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      )

      await page.goto('/users')

      await expect(page.getByText('Failed to load users')).toBeVisible()
      await expect(page.getByRole('table')).not.toBeVisible()
    })

    test('shows an error message when the network request fails', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.route('**/api/users', route => route.abort('failed'))

      await page.goto('/users')

      // When fetch is aborted the browser throws a TypeError whose message is
      // "Failed to fetch" (Chromium). UsersPage renders err.message directly,
      // so we match any of the possible error strings rather than a fixed one.
      await expect(
        page.getByText(/failed to fetch|network error|failed to load users/i)
      ).toBeVisible()
      await expect(page.getByRole('table')).not.toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  // Navbar — Users link visibility (role-based)
  // -------------------------------------------------------------------------

  test.describe('Navbar Users link', () => {
    test('admin can navigate to /users via the Users nav link', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/')
      await page.getByRole('link', { name: 'Users' }).click()

      await expect(page).toHaveURL('/users')
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    })

    test('Users nav link is not visible to agents', async ({ page, context }) => {
      await loginInContext(context, { email: AGENT_EMAIL, password: AGENT_PASSWORD })

      await page.goto('/')
      await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  // Route protection (non-duplicating — auth.spec.ts already covers these
  // redirects; these tests verify the page heading renders correctly after a
  // successful admin access, and that the heading is absent after a redirect)
  // -------------------------------------------------------------------------

  test.describe('Route protection', () => {
    test('unauthenticated access to /users redirects to /login', async ({ page }) => {
      await page.goto('/users')
      await expect(page).toHaveURL('/login')
    })

    test('agent access to /users redirects to /', async ({ page, context }) => {
      await loginInContext(context, { email: AGENT_EMAIL, password: AGENT_PASSWORD })

      await page.goto('/users')
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'Users' })).not.toBeVisible()
    })

    test('admin access to /users renders the Users heading', async ({
      page,
      context,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/users')
      await expect(page).toHaveURL('/users')
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    })
  })

  // -------------------------------------------------------------------------
  // API endpoint protection (direct HTTP — no browser session)
  // -------------------------------------------------------------------------

  test.describe('API protection', () => {
    test('GET /api/users without a session returns 401', async ({ request }) => {
      const response = await request.get(`${SERVER_BASE_URL}/api/users`)
      expect(response.status()).toBe(401)
    })

    test('GET /api/users response body contains error field when unauthenticated', async ({
      request,
    }) => {
      const response = await request.get(`${SERVER_BASE_URL}/api/users`)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    test('GET /api/users with an agent session returns 403', async ({
      page,
      context,
      request,
    }) => {
      // Sign in via the browser to obtain the session cookie, then reuse it
      // in the API request by extracting cookies from the browser context.
      await loginInContext(context, { email: AGENT_EMAIL, password: AGENT_PASSWORD })

      // Navigate to any page to ensure the cookie is set.
      await page.goto('/')

      const cookies = await context.cookies()
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      expect(response.status()).toBe(403)
    })

    test('GET /api/users with an admin session returns 200 and an array', async ({
      page,
      context,
      request,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/')

      const cookies = await context.cookies()
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(2)
    })

    test('GET /api/users response items include expected fields', async ({
      page,
      context,
      request,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/')

      const cookies = await context.cookies()
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      const [firstUser] = await response.json()
      expect(firstUser).toHaveProperty('id')
      expect(firstUser).toHaveProperty('name')
      expect(firstUser).toHaveProperty('email')
      expect(firstUser).toHaveProperty('role')
      expect(firstUser).toHaveProperty('createdAt')
    })

    test('GET /api/users response does not include password-related fields', async ({
      page,
      context,
      request,
    }) => {
      await loginInContext(context, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

      await page.goto('/')

      const cookies = await context.cookies()
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      const users = await response.json()
      for (const user of users) {
        expect(user).not.toHaveProperty('password')
        expect(user).not.toHaveProperty('hashedPassword')
      }
    })
  })
})
