import { test, expect, type Page } from '@playwright/test'
import {
  ADMIN_NAME,
  ADMIN_EMAIL,
  AGENT_NAME,
  AGENT_EMAIL,
  loginAsAdmin,
  loginAsAgent,
} from '../helpers'

const SERVER_BASE_URL = 'http://localhost:3001'

async function createUser(
  page: Page,
  options?: { password?: string }
): Promise<{ name: string; email: string }> {
  const suffix = Date.now()
  const name = `User ${suffix}`
  const email = `user${suffix}@example.com`

  await page.getByRole('button', { name: 'New user' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(options?.password ?? 'TestPass1!')
  await page.getByRole('button', { name: 'Create user' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  return { name, email }
}

test.describe('UsersPage', () => {
  test.describe('route protection', () => {
    test('unauthenticated access to /users redirects to /login', async ({ page }) => {
      await page.goto('/users')
      await expect(page).toHaveURL('/login')
    })

    test('authenticated agent visiting /users is NOT allowed', async ({ page }) => {
      await loginAsAgent(page)

      await page.goto('/users')
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'Users' })).not.toBeVisible()
    })

    test('authenticated admin visiting /tickets is allowed', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      await expect(page).toHaveURL('/users')
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    })
  })

  test.describe('API protection', () => {
    test('GET /api/users without a session returns 401', async ({ request }) => {
      const response = await request.get(`${SERVER_BASE_URL}/api/users`)
      expect(response.status()).toBe(401)
    })

    test('GET /api/users response body contains error field when unauthenticated', async ({ request }) => {
      const response = await request.get(`${SERVER_BASE_URL}/api/users`)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })

    test('GET /api/users with an agent session returns 403', async ({ page, request }) => {
      // Sign in via the browser to obtain the session cookie, then reuse it
      // in the API request by extracting cookies from the browser context.
      await loginAsAgent(page)

      await page.goto('/')

      const cookies = await page.context().cookies()
      const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      expect(response.status()).toBe(403)
    })

    test('GET /api/users with an admin session returns 200 and an array', async ({ page, request }) => {
      await loginAsAdmin(page)

      await page.goto('/')

      const cookies = await page.context().cookies()
      const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

      const response = await request.get(`${SERVER_BASE_URL}/api/users`, {
        headers: { Cookie: cookieHeader },
      })

      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThanOrEqual(2)
    })

    test('GET /api/users response items include expected fields', async ({ page, request }) => {
      await loginAsAdmin(page)

      await page.goto('/')

      const cookies = await page.context().cookies()
      const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

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

    test('GET /api/users response does not include password-related fields', async ({ page, request }) => {
      await loginAsAdmin(page)

      await page.goto('/')

      const cookies = await page.context().cookies()
      const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')

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

  test.describe('data rendering', () => {
    test('renders all five column headers', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      await expect(page).toHaveURL('/users')

      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    })

    test('shows both seeded users (admin + agent) in the table', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')

      await expect(page.getByRole('cell', { name: ADMIN_NAME, exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: ADMIN_EMAIL, exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: AGENT_NAME, exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: AGENT_EMAIL, exact: true })).toBeVisible()
    })

    test.describe('loading state', () => {
      test('shows skeleton rows while the API request is in flight', async ({ page }) => {
        await loginAsAdmin(page)

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

      test('table shows real data after the API request completes', async ({ page }) => {
        await loginAsAdmin(page)

        await page.goto('/users')

        await expect(page.getByRole('cell', { name: ADMIN_EMAIL })).toBeVisible()
        await expect(page.getByRole('table')).toBeVisible()
      })
    })

    test.describe('error state', () => {
      test('shows an error message when the API returns a server error', async ({ page }) => {
        await loginAsAdmin(page)

        await page.route('**/api/users', route =>
          route.fulfill({ status: 500, body: 'Internal Server Error' })
        )

        await page.goto('/users')

        await expect(page.getByText('Failed to load users')).toBeVisible()
        await expect(page.getByRole('table')).not.toBeVisible()
      })

      test('shows an error message when the network request fails', async ({ page }) => {
        await loginAsAdmin(page)

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

    test.describe('navbar Users link', () => {
      test('admin can navigate to /users via the Users nav link', async ({ page }) => {
        await loginAsAdmin(page)

        await page.goto('/')
        await page.getByRole('link', { name: 'Users' }).click()

        await expect(page).toHaveURL('/users')
        await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
      })

      test('Users nav link is not visible to agents', async ({ page }) => {
        await loginAsAgent(page)

        await page.goto('/')
        await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible()
      })
    })
  })

  test.describe('create user', () => {
    test('opens "Create user" dialog when "New user" button is clicked', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')

      await page.getByRole('button', { name: 'New user' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Create user' })).toBeVisible()
    })

    test('creates a new user and shows the row in the table without a page reload', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      const { name, email } = await createUser(page)

      await expect(page.getByRole('cell', { name })).toBeVisible()
      await expect(page.getByRole('cell', { name: email })).toBeVisible()
    })
  })

  test.describe('edit user', () => {
    test('opens "Edit user" dialog with pre-populated fields when pencil button is clicked', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      const { name, email } = await createUser(page)

      const row = page.getByRole('row').filter({ hasText: email })
      await row.getByRole('button', { name: 'Edit user' }).click()

      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Edit user' })).toBeVisible()

      await expect(page.getByLabel('Name')).toHaveValue(name)
      await expect(page.getByLabel('Email')).toHaveValue(email)
    })

    test('updates the user name in the table without a page reload', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      const { name: originalName, email: originalEmail } = await createUser(page)
      const updatedName = `${originalName} edited`
      const updatedEmail = `edited.${originalEmail}`

      const row = page.getByRole('row').filter({ hasText: originalEmail })
      await row.getByRole('button', { name: 'Edit user' }).click()

      await page.getByLabel('Name').fill(updatedName)
      await page.getByLabel('Email').clear()
      await page.getByLabel('Email').fill(updatedEmail)
      await page.getByRole('button', { name: 'Save changes' }).click()

      await expect(page.getByRole('dialog')).not.toBeVisible()

      await expect(page.getByRole('cell', { name: updatedName, exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: updatedEmail, exact: true })).toBeVisible()
      await expect(page.getByRole('cell', { name: originalName, exact: true })).not.toBeVisible()
      await expect(page.getByRole('cell', { name: originalEmail, exact: true })).not.toBeVisible()
    })
  })

  test.describe('delete user', () => {
    test('opens "Delete user" confirmation dialog when trash button is clicked', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      const { email } = await createUser(page)

      const row = page.getByRole('row').filter({ hasText: email })
      await row.getByRole('button', { name: 'Delete user' }).click()

      await expect(page.getByRole('alertdialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Delete user' })).toBeVisible()
    })

    test('deletes the user and removes the row from the table without a page reload', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/users')
      const { name, email } = await createUser(page)
      await expect(page.getByRole('cell', { name })).toBeVisible()

      const row = page.getByRole('row').filter({ hasText: email })
      await row.getByRole('button', { name: 'Delete user' }).click()
      await expect(page.getByRole('alertdialog')).toBeVisible()

      await page.getByRole('button', { name: 'Delete' }).click()

      await expect(page.getByRole('alertdialog')).not.toBeVisible()
      await expect(page.getByRole('cell', { name })).not.toBeVisible()
      await expect(page.getByRole('cell', { name: email })).not.toBeVisible()
    })
  })
})
