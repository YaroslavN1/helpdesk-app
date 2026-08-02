import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import { apiClient } from '@/lib/api-client'
import { renderWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved, mockRejected, mockPending } from '@/test-utils/mock-helpers'
import { AGENTS, openTechnicalTicketDetails } from '@/test-utils/fixtures'
import TicketDetailsPage from './TicketDetailsPage'
import { TicketStatus, TicketCategory, type TicketDetails } from '@helpdesk/core'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

const DEFAULT_TICKET: TicketDetails = openTechnicalTicketDetails

const TICKET_WITH_HTML_BODY: TicketDetails = {
  ...DEFAULT_TICKET,
  htmlBody: '<p>HTML email body</p>',
}

const TICKET_NO_ASSIGNED: TicketDetails = {
  ...DEFAULT_TICKET,
  assignedTo: null,
}

const TICKET_NO_CATEGORY: TicketDetails = {
  ...DEFAULT_TICKET,
  category: null,
}

const TICKET_RESOLVED_STATUS: TicketDetails = {
  ...DEFAULT_TICKET,
  status: TicketStatus.resolved,
}

const TICKET_GENERAL_CATEGORY: TicketDetails = {
  ...DEFAULT_TICKET,
  category: TicketCategory.general_question,
}

function mockGetTicket(ticket: TicketDetails = DEFAULT_TICKET) {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url === '/users/agents') return Promise.resolve({ data: AGENTS })
    return Promise.resolve({ data: ticket })
  })
}

function mockPatchTicket(patchTicket: TicketDetails) {
  mockResolved(apiClient.patch, { data: patchTicket })
}

function renderTicketDetailsPage(id: string | number = '1') {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[`/tickets/${id}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function findAndClickOption(user: UserEvent, testId: string, optionName: string) {
  await user.click(screen.getByTestId(testId))
  await user.click(await within(document.body).findByRole('option', { name: optionName }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketDetailsPage', () => {
  describe('loading the data', () => {
    it('calls the correct API endpoint', () => {
      mockPending(apiClient.get)
      renderTicketDetailsPage()

      expect(apiClient.get).toHaveBeenCalledWith('/tickets/1')
    })

    it('shows the skeleton while fetch is pending', () => {
      mockPending(apiClient.get)
      renderTicketDetailsPage()

      expect(screen.getByTestId('ticket-detail-skeleton')).toBeInTheDocument()
    })

    it('does not show an error while fetch is pending', () => {
      mockPending(apiClient.get)
      renderTicketDetailsPage()

      expect(screen.queryByText('Failed to load ticket')).not.toBeInTheDocument()
      expect(screen.queryByText('Ticket not found')).not.toBeInTheDocument()
    })

    it('shows an error when the fetch fails', async () => {
      mockRejected(apiClient.get, { isAxiosError: true, response: undefined })
      renderTicketDetailsPage()

      await waitFor(() => expect(screen.getByText('Failed to load ticket')).toBeInTheDocument())
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('shows "Ticket not found" on a 404', async () => {
      mockRejected(apiClient.get, {
        isAxiosError: true,
        response: { status: 404, data: { error: 'Ticket not found' } },
      })
      renderTicketDetailsPage()

      await waitFor(() => expect(screen.getByText('Ticket not found')).toBeInTheDocument())
    })
  })

  describe('page header', () => {
    it('renders the back link to /tickets', () => {
      mockPending(apiClient.get)
      renderTicketDetailsPage()

      const backLink = screen.getByRole('link', { name: '← Tickets' })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/tickets')
    })

    it('renders subject with #id prefix', async () => {
      mockGetTicket()
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
        expect(screen.getByText('#1')).toBeInTheDocument()
        expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
      })
    })
  })

  describe('ticket metadata', () => {
    describe('static metadata', () => {
      it('renders the sender name and email', async () => {
        mockGetTicket()
        renderTicketDetailsPage()

        await waitFor(() => {
          expect(screen.getByText('From')).toBeInTheDocument()
          expect(screen.getByText('Alice Smith <alice@example.com>')).toBeInTheDocument()
        })
      })

      it('renders the received date', async () => {
        mockGetTicket()
        renderTicketDetailsPage()

        await waitFor(() => {
          expect(screen.getByText('Received')).toBeInTheDocument()
          expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument()
        })
      })

      it('renders the updated date', async () => {
        mockGetTicket()
        renderTicketDetailsPage()

        await waitFor(() => {
          expect(screen.getByText('Updated')).toBeInTheDocument()
          expect(screen.getByText(/Mar 16, 2024/)).toBeInTheDocument()
        })
      })
    })

    describe('metadata selectors', () => {
      describe('status', () => {
        it('renders the current value', async () => {
          mockGetTicket()
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('status-select')).toHaveTextContent('Open')
          })
        })

        it('changing status sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          mockGetTicket()
          mockPatchTicket(TICKET_RESOLVED_STATUS)
          renderTicketDetailsPage()
          await screen.findByTestId('status-select')
          await findAndClickOption(user, 'status-select', 'Resolved')

          await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', {
              status: TicketStatus.resolved,
            })
            expect(screen.getByTestId('status-select')).toHaveTextContent('Resolved')
          })
        })
      })

      describe('category', () => {
        it('renders the current value', async () => {
          mockGetTicket()
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('category-select')).toHaveTextContent('Technical')
          })
        })

        it('shows "—" when category is null', async () => {
          mockGetTicket(TICKET_NO_CATEGORY)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('category-select')).toHaveTextContent('—')
          })
        })

        it('changing category sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          mockGetTicket()
          mockPatchTicket(TICKET_GENERAL_CATEGORY)
          renderTicketDetailsPage()
          await screen.findByTestId('category-select')
          await findAndClickOption(user, 'category-select', 'General')

          await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', {
              category: TicketCategory.general_question,
            })
            expect(screen.getByTestId('category-select')).toHaveTextContent('General')
          })
        })

        it('clearing category sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          mockGetTicket()
          mockPatchTicket(TICKET_NO_CATEGORY)
          renderTicketDetailsPage()
          await screen.findByTestId('category-select')
          await findAndClickOption(user, 'category-select', '—')

          await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', { category: null })
            expect(screen.getByTestId('category-select')).not.toHaveTextContent('Technical')
          })
        })
      })

      describe('assigned to', () => {
        it('renders the assigned agent name', async () => {
          mockGetTicket()
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByText('Assigned to')).toBeInTheDocument()
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('Bob Agent')
          })
        })

        it('shows "—" when no agent is assigned', async () => {
          mockGetTicket(TICKET_NO_ASSIGNED)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('—')
          })
        })

        it('assigning an agent sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          mockGetTicket(TICKET_NO_ASSIGNED)
          mockPatchTicket(DEFAULT_TICKET)
          renderTicketDetailsPage()
          await screen.findByTestId('assign-to-select')
          await findAndClickOption(user, 'assign-to-select', DEFAULT_TICKET.assignedTo!.name)

          await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', {
              assignedToId: DEFAULT_TICKET.assignedTo!.id,
            })
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent(
              DEFAULT_TICKET.assignedTo!.name,
            )
          })
        })

        it('unassigning sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          mockGetTicket()
          mockPatchTicket(TICKET_NO_ASSIGNED)
          renderTicketDetailsPage()
          await screen.findByTestId('assign-to-select')
          await findAndClickOption(user, 'assign-to-select', '—')

          await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', { assignedToId: null })
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('—')
          })
        })
      })

      it('shows an error below the Select when the PATCH fails', async () => {
        const user = userEvent.setup()
        mockGetTicket()
        mockRejected(apiClient.patch, { isAxiosError: true, response: undefined })
        renderTicketDetailsPage()
        await screen.findByTestId('assign-to-select')
        await findAndClickOption(user, 'assign-to-select', 'Carol Agent')

        await screen.findByText('Failed to update ticket')
      })
    })
  })

  describe('conversation', () => {
    it('renders the plain text body when htmlBody is null', async () => {
      mockGetTicket()
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
        expect(document.querySelector('iframe')).not.toBeInTheDocument()
      })
    })

    it('renders an iframe when htmlBody is present', async () => {
      mockGetTicket(TICKET_WITH_HTML_BODY)
      renderTicketDetailsPage()

      await waitFor(() => {
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('title', 'Email body')
        expect(iframe).toHaveAttribute('srcDoc', '<p>HTML email body</p>')
      })
    })

    it('does not render the plain text body when htmlBody is present', async () => {
      mockGetTicket(TICKET_WITH_HTML_BODY)
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(document.querySelector('iframe')).toBeInTheDocument()
      })
      expect(screen.queryByText('Plain text body content.')).not.toBeInTheDocument()
    })
  })
})
