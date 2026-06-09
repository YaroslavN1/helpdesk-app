import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsAgent, seedTicket, setTicketFields, type SeededTicket } from '../helpers'

test.describe('Ticket Details — route protection', () => {
  test('unauthenticated user visiting /tickets/:id is redirected to /login', async ({ page, request }) => {
    const ticket = await seedTicket(request, {
      from: 'guard@example.com',
      fromName: 'Guard Test',
      subject: 'Guard test ticket',
    })

    await page.goto(`/tickets/${ticket.id}`)
    await expect(page).toHaveURL('/login')
  })

  test('authenticated agent can view a ticket detail page', async ({ page, request }) => {
    const ticket = await seedTicket(request, {
      from: 'agent-view@example.com',
      fromName: 'Agent View',
      subject: 'Agent view test ticket',
    })
    await loginAsAgent(page)
    await page.goto(`/tickets/${ticket.id}`)

    await expect(page).toHaveURL(`/tickets/${ticket.id}`)
    await expect(page.getByRole('heading', { level: 2 })).toContainText(ticket.subject)
  })
})

test.describe('Ticket Details — navigation', () => {
  test('back link returns to /tickets', async ({ page, request }) => {
    const ticket = await seedTicket(request, {
      from: 'nav@example.com',
      fromName: 'Nav Test',
      subject: 'Navigation test ticket',
    })
    await loginAsAdmin(page)
    await page.goto(`/tickets/${ticket.id}`)

    await page.getByRole('link', { name: '← Tickets' }).click()

    await expect(page).toHaveURL('/tickets')
  })
})

test.describe('Ticket Details — data rendering', () => {
  let ticket: SeededTicket
  let htmlTicket: SeededTicket

  test.beforeAll(async ({ request }) => {
    ticket = await seedTicket(request, {
      from: 'sender@example.com',
      fromName: 'Sender Name',
      subject: 'Detail rendering test ticket',
      body: 'This is the plain text body.',
    })
    htmlTicket = await seedTicket(request, {
      from: 'html@example.com',
      fromName: 'HTML Sender',
      subject: 'HTML email ticket',
      body: 'Plain text fallback.',
      htmlBody: '<p>HTML email content</p>',
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`/tickets/${ticket.id}`)
  })

  test('renders the subject with id prefix', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 })).toContainText(`#${ticket.id}`)
    await expect(page.getByRole('heading', { level: 2 })).toContainText(ticket.subject)
  })

  test('renders the Status badge', async ({ page }) => {
    await expect(page.getByText('Open', { exact: true })).toBeVisible()
  })

  test('renders the Category badge', async ({ page }) => {
    await setTicketFields([{ id: ticket.id, status: 'open', category: 'general_question' }])
    await page.reload()

    await expect(page.getByText('General question')).toBeVisible()
  })

  test('renders From metadata with name and email', async ({ page }) => {
    await expect(page.getByText(`${ticket.fromName} <${ticket.fromEmail}>`)).toBeVisible()
  })

  test('renders Unassigned when no agent is assigned', async ({ page }) => {
    await expect(page.getByText('Unassigned', { exact: true })).toBeVisible()
  })

  test('renders the Received date', async ({ page }) => {
    const expectedDate = new Date(ticket.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    await expect(page.getByText(expectedDate)).toBeVisible()
  })

  test('renders the plain text email body', async ({ page }) => {
    await expect(page.getByText('This is the plain text body.')).toBeVisible()
  })

  test('renders an iframe for html email body', async ({ page }) => {
    await page.goto(`/tickets/${htmlTicket.id}`)
    await expect(page.frameLocator('iframe[title="Email body"]').locator('p')).toBeVisible()
  })
})

test.describe('Ticket Details — error states', () => {
  test('shows "Ticket not found" for a non-existent ticket id', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/tickets/999999999')

    await expect(page.getByText('Ticket not found')).toBeVisible()
  })

  test('shows error message when the API request fails', async ({ page }) => {
    await loginAsAdmin(page)

    await page.route('**/api/tickets/*', (route) => route.abort('failed'))
    await page.goto('/tickets/1')

    await expect(page.getByText(/failed to fetch|failed to load ticket/i)).toBeVisible()
  })
})

