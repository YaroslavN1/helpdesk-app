import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import TicketDetailsPage from './TicketDetailsPage'
import { TicketStatus, TicketCategory, type TicketDetails, type AgentOption } from '@helpdesk/core'

const DEFAULT_TICKET: TicketDetails = {
  id: 42,
  fromEmail: 'alice@example.com',
  fromName: 'Alice Smith',
  subject: 'Cannot log in to my account',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  assignedTo: { id: 'agent-1', name: 'Bob Agent' },
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-16T08:00:00.000Z',
  body: 'Plain text body content.',
  htmlBody: null,
}

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

const AGENTS: AgentOption[] = [
  { id: 'agent-1', name: 'Bob Agent' },
  { id: 'agent-2', name: 'Carol Agent' },
]

function mockFetch(
  ticket: unknown,
  {
    ok = true,
    agents = AGENTS,
    patchTicket = ticket as TicketDetails,
    patchOk = true,
  }: {
    ok?: boolean
    agents?: AgentOption[]
    patchTicket?: TicketDetails
    patchOk?: boolean
  } = {},
) {
  const fetchSpy = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/users/agents') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(agents),
      })
    }
    if (url.includes('/api/tickets/')) {
      if (init?.method === 'PATCH') {
        return Promise.resolve({
          ok: patchOk,
          json: () => Promise.resolve(patchTicket),
        })
      }
      return Promise.resolve({
        ok,
        status: ok ? 200 : 500,
        json: () => Promise.resolve(ticket),
      })
    }
  })
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
}

function expectPatchRequest(fetchSpy: ReturnType<typeof vi.fn>, body: Record<string, unknown>) {
  expect(fetchSpy).toHaveBeenCalledWith(
    '/api/tickets/42',
    expect.objectContaining({
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(body),
    }),
  )
}

function renderTicketDetailsPage(id: string | number = '42') {
  return render(
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
  vi.unstubAllGlobals()
})

describe('TicketDetailsPage', () => {
  describe('loading the data', () => {
    it('calls the correct API endpoint with credentials include', () => {
      const fetchSpy = vi.fn().mockReturnValue(new Promise(() => {}))
      vi.stubGlobal('fetch', fetchSpy)
      renderTicketDetailsPage()

      expect(fetchSpy).toHaveBeenCalledWith('/api/tickets/42', {
        credentials: 'include',
      })
    })

    it('shows the skeleton while fetch is pending', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetailsPage()

      expect(screen.getByTestId('ticket-detail-skeleton')).toBeInTheDocument()
    })

    it('does not show an error while fetch is pending', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetailsPage()

      expect(screen.queryByText('Failed to load ticket')).not.toBeInTheDocument()
      expect(screen.queryByText('Ticket not found')).not.toBeInTheDocument()
    })

    it('shows an error when the fetch fails', async () => {
      mockFetch(null, { ok: false })
      renderTicketDetailsPage()

      await waitFor(() => expect(screen.getByText('Failed to load ticket')).toBeInTheDocument())
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('shows "Ticket not found" on a 404', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: () => Promise.resolve(null),
        }),
      )
      renderTicketDetailsPage()

      await waitFor(() => expect(screen.getByText('Ticket not found')).toBeInTheDocument())
    })
  })

  describe('page header', () => {
    it('renders the back link to /tickets', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetailsPage()

      const backLink = screen.getByRole('link', { name: '← Tickets' })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/tickets')
    })

    it('renders subject with #id prefix', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
        expect(screen.getByText('#42')).toBeInTheDocument()
        expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
      })
    })
  })

  describe('ticket metadata', () => {
    describe('static metadata', () => {
      it('renders the sender name and email', async () => {
        mockFetch(DEFAULT_TICKET)
        renderTicketDetailsPage()

        await waitFor(() => {
          expect(screen.getByText('From')).toBeInTheDocument()
          expect(screen.getByText('Alice Smith <alice@example.com>')).toBeInTheDocument()
        })
      })

      it('renders the received date', async () => {
        mockFetch(DEFAULT_TICKET)
        renderTicketDetailsPage()

        await waitFor(() => {
          expect(screen.getByText('Received')).toBeInTheDocument()
          expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument()
        })
      })

      it('renders the updated date', async () => {
        mockFetch(DEFAULT_TICKET)
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
          mockFetch(DEFAULT_TICKET)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('status-select')).toHaveTextContent('Open')
          })
        })

        it('changing status sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          const fetchSpy = mockFetch(DEFAULT_TICKET, {
            patchTicket: TICKET_RESOLVED_STATUS,
          })
          renderTicketDetailsPage()
          await screen.findByTestId('status-select')
          await findAndClickOption(user, 'status-select', 'Resolved')

          await waitFor(() => {
            expectPatchRequest(fetchSpy, { status: TicketStatus.resolved })
            expect(screen.getByTestId('status-select')).toHaveTextContent('Resolved')
          })
        })
      })

      describe('category', () => {
        it('renders the current value', async () => {
          mockFetch(DEFAULT_TICKET)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('category-select')).toHaveTextContent('Technical')
          })
        })

        it('shows "—" when category is null', async () => {
          mockFetch(TICKET_NO_CATEGORY)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('category-select')).toHaveTextContent('—')
          })
        })

        it('changing category sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          const fetchSpy = mockFetch(DEFAULT_TICKET, {
            patchTicket: TICKET_GENERAL_CATEGORY,
          })
          renderTicketDetailsPage()
          await screen.findByTestId('category-select')
          await findAndClickOption(user, 'category-select', 'General')

          await waitFor(() => {
            expectPatchRequest(fetchSpy, {
              category: TicketCategory.general_question,
            })
            expect(screen.getByTestId('category-select')).toHaveTextContent('General')
          })
        })

        it('clearing category sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          const fetchSpy = mockFetch(DEFAULT_TICKET, {
            patchTicket: TICKET_NO_CATEGORY,
          })
          renderTicketDetailsPage()
          await screen.findByTestId('category-select')
          await findAndClickOption(user, 'category-select', '—')

          await waitFor(() => {
            expectPatchRequest(fetchSpy, { category: null })
            expect(screen.getByTestId('category-select')).not.toHaveTextContent('Technical')
          })
        })
      })

      describe('assigned to', () => {
        it('renders the assigned agent name', async () => {
          mockFetch(DEFAULT_TICKET, { agents: [DEFAULT_TICKET.assignedTo!] })
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByText('Assigned to')).toBeInTheDocument()
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('Bob Agent')
          })
        })

        it('shows "—" when no agent is assigned', async () => {
          mockFetch(TICKET_NO_ASSIGNED)
          renderTicketDetailsPage()

          await waitFor(() => {
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('—')
          })
        })

        it('assigning an agent sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          const fetchSpy = mockFetch(TICKET_NO_ASSIGNED, {
            patchTicket: DEFAULT_TICKET,
          })
          renderTicketDetailsPage()
          await screen.findByTestId('assign-to-select')
          await findAndClickOption(user, 'assign-to-select', DEFAULT_TICKET.assignedTo!.name)

          await waitFor(() => {
            expectPatchRequest(fetchSpy, {
              assignedToId: DEFAULT_TICKET.assignedTo!.id,
            })
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent(
              DEFAULT_TICKET.assignedTo!.name,
            )
          })
        })

        it('unassigning sends correct PATCH request and updates the Select', async () => {
          const user = userEvent.setup()
          const fetchSpy = mockFetch(DEFAULT_TICKET, {
            patchTicket: TICKET_NO_ASSIGNED,
          })
          renderTicketDetailsPage()
          await screen.findByTestId('assign-to-select')
          await findAndClickOption(user, 'assign-to-select', '—')

          await waitFor(() => {
            expectPatchRequest(fetchSpy, { assignedToId: null })
            expect(screen.getByTestId('assign-to-select')).toHaveTextContent('—')
          })
        })
      })

      it('shows an error below the Select when the PATCH fails', async () => {
        const user = userEvent.setup()
        mockFetch(DEFAULT_TICKET, { patchOk: false })
        renderTicketDetailsPage()
        await screen.findByTestId('assign-to-select')
        await findAndClickOption(user, 'assign-to-select', 'Carol Agent')

        await screen.findByText('Failed to update ticket')
      })
    })
  })

  describe('conversation', () => {
    it('renders the plain text body when htmlBody is null', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
        expect(document.querySelector('iframe')).not.toBeInTheDocument()
      })
    })

    it('renders an iframe when htmlBody is present', async () => {
      mockFetch(TICKET_WITH_HTML_BODY)
      renderTicketDetailsPage()

      await waitFor(() => {
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('title', 'Email body')
        expect(iframe).toHaveAttribute('srcDoc', '<p>HTML email body</p>')
      })
    })

    it('does not render the plain text body when htmlBody is present', async () => {
      mockFetch(TICKET_WITH_HTML_BODY)
      renderTicketDetailsPage()

      await waitFor(() => {
        expect(document.querySelector('iframe')).toBeInTheDocument()
      })
      expect(screen.queryByText('Plain text body content.')).not.toBeInTheDocument()
    })
  })
})
