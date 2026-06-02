import { test, expect, type APIRequestContext } from '@playwright/test'
import { loginAsAdmin, loginAsAgent } from '../helpers'

const SERVER_BASE_URL = process.env.BETTER_AUTH_URL!

const defaultTicketPayload = {
  from: 'customer@example.com',
  fromName: 'Test Customer',
  subject: 'Login broken',
  body: 'I cannot log in to my account.',
}

/** POST a ticket via the inbound-email webhook and return the created ticket. */
async function seedTicket(
  request: APIRequestContext,
  overrides: Partial<typeof defaultTicketPayload> = {}
) {
  const payload = { ...defaultTicketPayload, ...overrides }

  const response = await request.post(
    `${SERVER_BASE_URL}/api/webhooks/inbound-email`,
    {
      headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET! },
      data: payload,
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

test.describe('Tickets page', () => {
  test.describe('Route protection', () => {
    test('unauthenticated user visiting /tickets is redirected to /login', async ({
      page,
    }) => {
      await page.goto('/tickets')
      await expect(page).toHaveURL('/login')
    })

    test('authenticated admin visiting /tickets is allowed', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/tickets')
      await expect(page).toHaveURL('/tickets')
      await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
    })

    test('authenticated agent visiting /tickets is allowed', async ({ page }) => {
      await loginAsAgent(page)
      await page.goto('/tickets')
      await expect(page).toHaveURL('/tickets')
      await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
    })
  })

  test.describe('Ticket data rendering', () => {
    test('renders all ticket fields correctly in the table row', async ({
      page,
      request,
    }) => {
      const ticket = await seedTicket(request)

      const expectedDate = new Date(ticket.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      await loginAsAdmin(page)
      await page.goto('/tickets')

      const row = page.getByRole('row').filter({ hasText: `#${ticket.id}` })

      await expect(row.getByText(`#${ticket.id}`)).toBeVisible()
      await expect(row.getByText(defaultTicketPayload.subject)).toBeVisible()
      await expect(row.getByText(defaultTicketPayload.fromName)).toBeVisible()
      await expect(row.getByText(defaultTicketPayload.from)).toBeVisible()
      await expect(row.getByText('open')).toBeVisible()
      await expect(row.getByText('—')).toBeVisible()
      await expect(row.getByText('Unassigned', { exact: true })).toBeVisible()
      await expect(row.getByText(expectedDate)).toBeVisible()
    })
  })
})

test.describe('GET /api/tickets — API protection', () => {
  test('returns 401 with an error body when called without a session', async ({ request }) => {
    const response = await request.get(`${SERVER_BASE_URL}/api/tickets`)
    expect(response.status()).toBe(401)
    expect(await response.json()).toHaveProperty('error')
  })

  test('response items include expected fields', async ({
    page,
    request,
  }) => {
    await request.post(`${SERVER_BASE_URL}/api/webhooks/inbound-email`, {
      headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET! },
      data: {
        from: 'fields@example.com',
        fromName: 'Fields Test',
        subject: 'Field check ticket',
        body: 'Checking response fields.',
      },
    })

    await loginAsAdmin(page)
    await page.goto('/')

    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const response = await request.get(`${SERVER_BASE_URL}/api/tickets`, {
      headers: { Cookie: cookieHeader },
    })

    const tickets = await response.json()
    const ticket = tickets[0]
    expect(ticket).toHaveProperty('id')
    expect(ticket).toHaveProperty('fromEmail')
    expect(ticket).toHaveProperty('fromName')
    expect(ticket).toHaveProperty('subject')
    expect(ticket).toHaveProperty('status')
    expect(ticket).toHaveProperty('category')
    expect(ticket).toHaveProperty('assignedTo')
    expect(ticket).toHaveProperty('createdAt')
  })
})
