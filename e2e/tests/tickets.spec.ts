import { Client } from 'pg'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { DEFAULT_PAGE_SIZE } from '../../core/src/constants/ticket'
import { loginAsAdmin, loginAsAgent } from '../helpers'

const SERVER_BASE_URL = process.env.BETTER_AUTH_URL!

async function goToTicketsPage(page: Page) {
  await loginAsAdmin(page)
  await page.goto('/tickets')
}

async function selectFilterOption(
  page: Page,
  multiselectDataTestId: string,
  optionLabel: string
) {
  await page.getByTestId(multiselectDataTestId).click()
  await page.getByTestId('multiselect-item').filter({ hasText: optionLabel }).click()
  await page.keyboard.press('Escape')
}

async function seedTicket(
  request: APIRequestContext,
  overrides: { from: string; fromName: string; subject: string }
) {
  const response = await request.post(
    `${SERVER_BASE_URL}/api/webhooks/inbound-email`,
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

type SeededTicket = Awaited<ReturnType<typeof seedTicket>>

async function clearTickets() {
  const db = new Client({ connectionString: process.env.DATABASE_URL! })
  await db.connect()
  await db.query('DELETE FROM "ticket"')
  await db.end()
}

async function setTicketFields(updates: Array<{ id: number; status: string; category: string | null }>) {
  const db = new Client({ connectionString: process.env.DATABASE_URL! })
  await db.connect()
  for (const { id, status, category } of updates) {
    await db.query(`UPDATE "ticket" SET status = $1, category = $2 WHERE id = $3`, [status, category, id])
  }
  await db.end()
}

test.describe('Client access control', () => {
  test('unauthenticated user visiting /tickets is redirected to /login', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL('/login')
  })

  test('authenticated admin visiting /tickets is allowed', async ({ page }) => {
    await goToTicketsPage(page)
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

test.describe('Server access control', () => {
  test('returns 401 with an error body when called without a session', async ({ request }) => {
    const response = await request.get(`${SERVER_BASE_URL}/api/tickets`)
    expect(response.status()).toBe(401)
    expect(await response.json()).toHaveProperty('error')
  })

  test('response items include expected fields', async ({ page, request }) => {
    await seedTicket(request, { from: 'fields@example.com', fromName: 'Fields Test', subject: 'Field check ticket' })

    await loginAsAdmin(page)
    await page.goto('/')

    const response = await page.request.get(`${SERVER_BASE_URL}/api/tickets`)

    const { tickets } = await response.json()
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

test.describe('Tickets page', () => {
  //openTicket variable on purpose doesn't have 'category' field set, hence shorter name
  let openTicket: SeededTicket
  let closedTechnicalTicket: SeededTicket
  let resolvedGeneralTicket: SeededTicket
  let openRefundTicket: SeededTicket

  test.beforeAll(async ({ request }) => {
    ;[openTicket, closedTechnicalTicket, resolvedGeneralTicket, openRefundTicket] = await Promise.all([
      seedTicket(request, { subject: 'Account login issue', from: 'alice@example.com', fromName: 'Alice' }),
      seedTicket(request, { subject: 'Zoom not working',   from: 'zara@example.com',  fromName: 'Zara'  }),
      seedTicket(request, { subject: 'Billing question',   from: 'bob@example.com',   fromName: 'Bob'   }),
      seedTicket(request, { subject: 'Payment failure',    from: 'dana@example.com',  fromName: 'Dana'  }),
    ])

    await setTicketFields([
      { id: closedTechnicalTicket.id,  status: 'closed',   category: 'technical_question' },
      { id: resolvedGeneralTicket.id,  status: 'resolved', category: 'general_question'   },
      { id: openRefundTicket.id,       status: 'open',     category: 'refund_request'     },
    ])
  })

  test.describe('Ticket data rendering', () => {
    test('renders all ticket fields correctly in the table row', async ({ page }) => {
      const expectedDate = new Date(openTicket.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

      await goToTicketsPage(page)

      const row = page.getByRole('row').filter({ hasText: String(openTicket.id) })

      await expect(row.getByText(String(openTicket.id))).toBeVisible()
      await expect(row.getByText(openTicket.subject)).toBeVisible()
      await expect(row.getByText(openTicket.fromName, { exact: true })).toBeVisible()
      await expect(row.getByText(openTicket.fromEmail)).toBeVisible()
      await expect(row.getByText('open')).toBeVisible()
      await expect(row.getByText('—')).toBeVisible()
      await expect(row.getByText('Unassigned', { exact: true })).toBeVisible()
      await expect(row.getByText(expectedDate)).toBeVisible()
    })
  })

  test.describe('Filtering — search field', () => {
    const cases: Array<{ field: string; getField: (ticket: SeededTicket) => string }> = [
      { field: 'id',           getField: ticket => String(ticket.id) },
      { field: 'subject',      getField: ticket => ticket.subject },
      { field: 'sender name',  getField: ticket => ticket.fromName },
      { field: 'sender email', getField: ticket => ticket.fromEmail },
    ]

    cases.forEach(({ field, getField }) => {
      test(`filters tickets by ${field}`, async ({ page }) => {
        await goToTicketsPage(page)

        await page.getByPlaceholder('Search tickets…').fill(getField(openTicket))

        await expect(page.getByRole('row').filter({ hasText: getField(openTicket) })).toBeVisible()
        await expect(page.getByRole('row').filter({ hasText: getField(closedTechnicalTicket) })).not.toBeVisible()
      })
    })
  })

  test.describe('Filtering — status multiselect', () => {
    test('filtering by selected statuses shows only relevant tickets', async ({ page }) => {
      await goToTicketsPage(page)

      await selectFilterOption(page, 'status-filter', 'open')
      await selectFilterOption(page, 'status-filter', 'resolved')

      await expect(page.getByRole('row').filter({ hasText: openTicket.subject })).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: resolvedGeneralTicket.subject })).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: closedTechnicalTicket.subject })).not.toBeVisible()
    })
  })

  test.describe('Filtering — category multiselect', () => {
    test('filtering by selected categories shows only relevant tickets', async ({ page }) => {
      await goToTicketsPage(page)

      await selectFilterOption(page, 'category-filter', 'General question')
      await selectFilterOption(page, 'category-filter', 'Refund request')

      await expect(page.getByRole('row').filter({ hasText: resolvedGeneralTicket.subject })).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: openRefundTicket.subject })).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: openTicket.subject })).not.toBeVisible()
    })
  })

  test.describe('Clear filters', () => {
    test('clears all active filters and restores all tickets', async ({ page }) => {
      await goToTicketsPage(page)

      await page.getByPlaceholder('Search tickets…').fill(resolvedGeneralTicket.subject)
      await selectFilterOption(page, 'status-filter', 'resolved')
      await selectFilterOption(page, 'category-filter', 'General question')

      await expect(page.getByRole('row').filter({ hasText: openTicket.subject })).not.toBeVisible()

      await page.getByRole('button', { name: 'Clear filters' }).click()

      await expect(page.getByPlaceholder('Search tickets…')).toHaveValue('')
      await expect(page.getByRole('row').filter({ hasText: resolvedGeneralTicket.subject })).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: closedTechnicalTicket.subject })).toBeVisible()
    })
  })

  test.describe('Sorting', () => {
    test('sorts tickets by Subject ascending then descending', async ({ page }) => {
      await goToTicketsPage(page)

      await page.getByRole('columnheader', { name: 'Subject' }).getByRole('button').click()

      await expect(page.getByRole('rowgroup').last().getByRole('row').first()).toContainText(openTicket.subject)

      await page.getByRole('columnheader', { name: 'Subject' }).getByRole('button').click()

      await expect(page.getByRole('rowgroup').last().getByRole('row').first()).toContainText(closedTechnicalTicket.subject)
    })
  })

  test.describe('Pagination', () => {
    test.beforeAll(async ({ request }) => {
      await clearTickets()

      for (let ticketNumber = 1; ticketNumber <= DEFAULT_PAGE_SIZE + 1; ticketNumber++) {
        const pageLabel = ticketNumber === 1 ? 'Second' : 'First'
        await seedTicket(request, {
          subject: `${pageLabel} page ticket ${ticketNumber}`,
          from: `ticket${ticketNumber}@example.com`,
          fromName: `Ticket User ${ticketNumber}`,
        })
      }
    })

    test('navigates between pages using page number buttons', async ({ page }) => {
      await goToTicketsPage(page)

      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).not.toBeVisible()

      await page.getByRole('button', { name: '2' }).click()

      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).not.toBeVisible()

      await page.getByRole('button', { name: '1' }).click()

      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).not.toBeVisible()
    })

    test('prev chevron button navigates back to page 1', async ({ page }) => {
      await goToTicketsPage(page)

      await page.getByRole('button', { name: '2' }).click()

      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).not.toBeVisible()

      const prevButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-chevron-left') })
      await prevButton.click()

      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).not.toBeVisible()
    })

    test('next chevron button navigates to page 2', async ({ page }) => {
      await goToTicketsPage(page)

      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).not.toBeVisible()

      const nextButton = page.getByRole('button').filter({ has: page.locator('svg.lucide-chevron-right') })
      await nextButton.click()

      await expect(page.getByRole('row').filter({ hasText: 'Second page ticket' }).first()).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'First page ticket' }).first()).not.toBeVisible()
    })
  })
})
