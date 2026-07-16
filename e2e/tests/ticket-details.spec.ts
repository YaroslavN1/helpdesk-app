import { test, expect } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsAgent,
  seedTicket,
  setTicketFields,
  AGENT_NAME,
  type SeededTicket,
} from '../helpers'

let ticket: SeededTicket
let htmlTicket: SeededTicket

test.describe('TicketDetailsPage', () => {
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

  test.describe('route protection', () => {
    test('unauthenticated user visiting /tickets/:id is redirected to /login', async ({ page }) => {
      await page.goto(`/tickets/${ticket.id}`)
      await expect(page).toHaveURL('/login')
    })

    test('authenticated agent can view a ticket detail page', async ({ page }) => {
      await loginAsAgent(page)
      await page.goto(`/tickets/${ticket.id}`)

      await expect(page).toHaveURL(`/tickets/${ticket.id}`)
      await expect(page.getByRole('heading', { level: 2 })).toContainText(ticket.subject)
    })
  })

  test.describe('error states', () => {
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

  test.describe('data rendering', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto(`/tickets/${ticket.id}`)
    })

    test.describe('page header', () => {
      test('back link returns to /tickets', async ({ page }) => {
        await page.getByRole('link', { name: '← Tickets' }).click()
        await expect(page).toHaveURL('/tickets')
      })

      test('renders the subject with id prefix', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 2 })).toContainText(`#${ticket.id}`)
        await expect(page.getByRole('heading', { level: 2 })).toContainText(ticket.subject)
      })
    })

    test.describe('ticket metadata', () => {
      test.describe('static metadata', () => {
        test('renders From metadata with name and email', async ({ page }) => {
          await expect(page.getByText(`${ticket.fromName} <${ticket.fromEmail}>`)).toBeVisible()
        })

        test('renders the Received date', async ({ page }) => {
          const expectedDate = new Date(ticket.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          await expect(page.locator('dt:has-text("Received") + dd')).toContainText(expectedDate)
        })

        test('renders the Updated date', async ({ page }) => {
          const expectedDate = new Date(ticket.updatedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          await expect(page.locator('dt:has-text("Updated") + dd')).toContainText(expectedDate)
        })
      })

      test.describe('metadata selectors', () => {
        test.describe('status', () => {
          test('renders the current status', async ({ page }) => {
            await setTicketFields([{ id: ticket.id, status: 'open', category: null }])
            await page.reload()

            await expect(page.getByTestId('status-select')).toContainText('Open')
          })

          test('changes status to Resolved and reflects the change before and after a reload', async ({
            page,
          }) => {
            await setTicketFields([{ id: ticket.id, status: 'open', category: null }])
            await page.reload()

            await page.getByTestId('status-select').click()
            await page.getByRole('option', { name: 'Resolved', exact: true }).click()

            await expect(page.getByTestId('status-select')).toContainText('Resolved')

            await page.reload()

            await expect(page.getByTestId('status-select')).toContainText('Resolved')
          })
        })

        test.describe('category', () => {
          test('renders the current category', async ({ page }) => {
            await setTicketFields([
              { id: ticket.id, status: 'open', category: 'technical_question' },
            ])
            await page.reload()

            await expect(page.getByTestId('category-select')).toContainText('Technical')
          })

          test('changes category from — to General and reflects the change before and after a reload', async ({
            page,
          }) => {
            await setTicketFields([{ id: ticket.id, status: 'open', category: null }])
            await page.reload()

            await expect(page.getByTestId('category-select')).toContainText('—')

            await page.getByTestId('category-select').click()
            await page.getByRole('option', { name: 'General', exact: true }).click()

            await expect(page.getByTestId('category-select')).toContainText('General')

            await page.reload()

            await expect(page.getByTestId('category-select')).toContainText('General')
          })
        })

        test.describe('assigned to', () => {
          test('renders — when no agent is assigned', async ({ page }) => {
            await expect(page.getByTestId('assign-to-select')).toContainText('—')
          })

          test('assigns an agent via the dropdown and reflects the change before and after a reload', async ({
            page,
          }) => {
            await page.getByTestId('assign-to-select').click()
            await page.getByRole('option', { name: AGENT_NAME }).click()

            await expect(page.getByTestId('assign-to-select')).toContainText(AGENT_NAME)

            await page.reload()

            await expect(page.getByTestId('assign-to-select')).toContainText(AGENT_NAME)
          })

          test('unassigns an agent and reflects — without a reload', async ({ page }) => {
            await page.getByTestId('assign-to-select').click()
            await page.getByRole('option', { name: AGENT_NAME }).click()
            await expect(page.getByTestId('assign-to-select')).toContainText(AGENT_NAME)

            await page.getByTestId('assign-to-select').click()
            await page.getByRole('option', { name: '—', exact: true }).click()

            await expect(page.getByTestId('assign-to-select')).toContainText('—')
          })
        })

        test('shows an error message when the PATCH request fails', async ({ page }) => {
          await page.route(`**/api/tickets/${ticket.id}`, (route) => {
            if (route.request().method() === 'PATCH') {
              route.abort('failed')
            } else {
              route.continue()
            }
          })

          await page.getByTestId('assign-to-select').click()
          await page.getByRole('option', { name: AGENT_NAME }).click()

          await expect(page.getByText(/failed to fetch|failed to update assignment/i)).toBeVisible()
        })
      })
    })

    test.describe('conversation', () => {
      test('renders the plain text email body', async ({ page }) => {
        await expect(page.getByText('This is the plain text body.')).toBeVisible()
      })

      test('renders an iframe for html email body', async ({ page }) => {
        await page.goto(`/tickets/${htmlTicket.id}`)
        await expect(page.frameLocator('iframe[title="Email body"]').locator('p')).toBeVisible()
      })
    })
  })
})
