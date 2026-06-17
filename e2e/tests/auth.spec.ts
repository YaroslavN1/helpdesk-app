import { test, expect } from '@playwright/test'
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AGENT_EMAIL,
  AGENT_PASSWORD,
  AGENT_NAME,
  loginAsAdmin,
  loginAsAgent,
} from '../helpers'

test.describe('Authentication', () => {
  test.describe('Signing-in', () => {
    test.describe('Success', () => {
      test('admin signs in with valid credentials and lands on /', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill(ADMIN_EMAIL)
        await page.getByLabel('Password').fill(ADMIN_PASSWORD)
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/')
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
      })

      test('agent signs in with valid credentials and lands on /', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('Email').fill(AGENT_EMAIL)
        await page.getByLabel('Password').fill(AGENT_PASSWORD)
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/')
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
      })

      test('already-authenticated user visiting /login is redirected to /', async ({ page }) => {
        await loginAsAdmin(page)

        await page.goto('/login')
        await expect(page).toHaveURL('/')
      })
    })

    test.describe('Errors', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/login')
      })

      test('wrong password shows an error message and stays on /login', async ({ page }) => {
        await page.getByLabel('Email').fill(ADMIN_EMAIL)
        await page.getByLabel('Password').fill('WrongPassword!')
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/login')
        await expect(page.getByText(/invalid email or password/i)).toBeVisible()
      })

      test('non-existent email shows an error message and stays on /login', async ({ page }) => {
        await page.getByLabel('Email').fill('nobody@nowhere.com')
        await page.getByLabel('Password').fill('SomePass1!')
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/login')
        await expect(page.getByText(/invalid email or password/i)).toBeVisible()
      })

      test('empty password and email fields shows validation errors for both', async ({ page }) => {
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/login')
        await expect(page.getByText('Email is required')).toBeVisible()
        await expect(page.getByText('Password is required')).toBeVisible()
      })

      test('invalid email format shows a validation error', async ({ page }) => {
        await page.getByLabel('Email').fill('not-an-email')
        await page.getByLabel('Password').fill(ADMIN_PASSWORD)
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/login')
        await expect(page.getByText('Invalid email address')).toBeVisible()
      })

      test('whitespace-only email is rejected with a validation error', async ({ page }) => {
        await page.getByLabel('Email').fill('   ')
        await page.getByLabel('Password').fill(ADMIN_PASSWORD)
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page).toHaveURL('/login')
        await expect(
          page.getByText(/email is required|invalid email address/i)
        ).toBeVisible()
      })

      test('sign-in button is disabled and shows "Signing in…" while the request is in flight', async ({ page }) => {
        // Delay the auth endpoint response so we can observe the loading state.
        await page.route('**/api/auth/sign-in/email', async route => {
          await new Promise<void>(resolve => setTimeout(resolve, 600))
          await route.continue()
        })

        await page.getByLabel('Email').fill(ADMIN_EMAIL)
        await page.getByLabel('Password').fill(ADMIN_PASSWORD)
        await page.getByRole('button', { name: 'Sign in' }).click()

        await expect(page.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
      })
    })
  })

  test.describe('Session and security', () => {
    test('session persists across a full page reload', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

      await page.reload()

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })

    test('session cookie is HTTP-only and not accessible via document.cookie', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/')

      // HTTP-only cookies must not appear in document.cookie
      const sessionCookieVisibleToJs = await page.evaluate(() =>
        document.cookie
          .split(';')
          .map(c => c.trim())
          .some(c => c.startsWith('better-auth.session_token'))
      )

      expect(sessionCookieVisibleToJs).toBe(false)
    })

    test('two concurrent tabs in the same browser context share the session', async ({ context }) => {
      // Authenticate in the first tab
      const tab1 = await context.newPage()
      await tab1.goto('/login')
      await tab1.getByLabel('Email').fill(ADMIN_EMAIL)
      await tab1.getByLabel('Password').fill(ADMIN_PASSWORD)
      await tab1.getByRole('button', { name: 'Sign in' }).click()
      await expect(tab1).toHaveURL('/')

      // Open a second tab — the cookie is shared across the context
      const tab2 = await context.newPage()
      await tab2.goto('/')
      await expect(tab2).toHaveURL('/')
      await expect(tab2.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

      await tab1.close()
      await tab2.close()
    })

    test("navbar displays the signed-in user's name", async ({ page }) => {
      await loginAsAgent(page)

      await page.goto('/')
      await expect(page.getByText(AGENT_NAME, { exact: true })).toBeVisible()
    })
  })

  test.describe('Catch-all (unknown) route redirection', () => {
    test('unknown route redirects authenticated users to /', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/this-route-does-not-exist')
      await expect(page).toHaveURL('/')
    })

    test('unknown route redirects unauthenticated users to /login', async ({ page }) => {
      await page.goto('/this-route-does-not-exist')
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Sign-out', () => {
    test('clicking Sign out clears the session and redirects to /login', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/')
      await page.getByRole('button', { name: 'Sign out' }).click()

      await expect(page).toHaveURL('/login')
    })

    test('after sign-out, navigating to / redirects to /login', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/')
      await page.getByRole('button', { name: 'Sign out' }).click()
      await expect(page).toHaveURL('/login')

      await page.goto('/')
      await expect(page).toHaveURL('/login')
    })

    test('after sign-out, browser back button does not restore the session', async ({ page }) => {
      await loginAsAdmin(page)

      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

      await page.getByRole('button', { name: 'Sign out' }).click()
      await expect(page).toHaveURL('/login')

      await page.goBack()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).not.toBeVisible()
    })
  })

})
