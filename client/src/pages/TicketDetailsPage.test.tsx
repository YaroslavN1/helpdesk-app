import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import TicketDetailsPage from './TicketDetailsPage'
import { TicketStatus, TicketCategory, type TicketDetails } from '@helpdesk/core'
import { formatDate } from '@/lib/utils'

const DEFAULT_TICKET: TicketDetails = {
  id: 42,
  fromEmail: 'alice@example.com',
  fromName: 'Alice Smith',
  subject: 'Cannot log in to my account',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  assignedTo: { id: 'agent-1', name: 'Bob Agent' },
  createdAt: '2024-03-15T10:00:00.000Z',
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

const AGENTS = [
  { id: 'agent-1', name: 'Bob Agent' },
  { id: 'agent-2', name: 'Carol Agent' },
]

function mockFetch(payload: unknown, ok = true, agents: unknown = AGENTS) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/tickets/')) {
      return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(payload) })
    }
    if (url === '/api/users/agents') {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(agents) })
    }
  }))
}

function renderTicketDetails(id: string | number = '42') {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${id}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockAssignFetch({ ok = true, ticket = DEFAULT_TICKET }: { ok?: boolean; ticket?: TicketDetails } = {}) {
  const patchFetch = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(ticket) })
  vi.stubGlobal('fetch', patchFetch)
  return patchFetch
}

async function selectAgent(user: UserEvent, optionName: string) {
  await user.click(screen.getByTestId('assign-to-select'))
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
      renderTicketDetails()

      expect(fetchSpy).toHaveBeenCalledWith('/api/tickets/42', { credentials: 'include' })
    })

    it('shows the skeleton while fetch is pending', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetails()

      expect(screen.getByTestId('ticket-detail-skeleton')).toBeInTheDocument()
    })

    it('does not show an error while fetch is pending', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetails()

      expect(screen.queryByText('Failed to load ticket')).not.toBeInTheDocument()
      expect(screen.queryByText('Ticket not found')).not.toBeInTheDocument()
    })

    it('shows an error when the fetch fails', async () => {
      mockFetch(null, false)
      renderTicketDetails()

      await waitFor(() => expect(screen.getByText('Failed to load ticket')).toBeInTheDocument())
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('shows "Ticket not found" on a 404', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve(null) }))
      renderTicketDetails()

      await waitFor(() =>
        expect(screen.getByText('Ticket not found')).toBeInTheDocument(),
      )
    })
  })

  describe('page header', () => {
    it('renders the back link to /tickets', () => {
      vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
      renderTicketDetails()

      const backLink = screen.getByRole('link', { name: '← Tickets' })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/tickets')
    })

    it('renders subject with #id prefix', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
        expect(screen.getByText('#42')).toBeInTheDocument()
        expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
      })
    })

    it('renders the status badge', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('Open')).toBeInTheDocument()
      })
    })

    it('renders the category badge', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('Technical question')).toBeInTheDocument()
      })
    })

    it('omits the category badge when category is null', async () => {
      mockFetch(TICKET_NO_CATEGORY)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('Open')).toBeInTheDocument()
        expect(screen.queryByText('Technical question')).not.toBeInTheDocument()
        expect(screen.queryByText('General question')).not.toBeInTheDocument()
        expect(screen.queryByText('Refund request')).not.toBeInTheDocument()
      })
    })
  })

  describe('details', () => {
    it('renders the sender name and email', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('From')).toBeInTheDocument()
        expect(screen.getByText('Alice Smith <alice@example.com>')).toBeInTheDocument()
      })
    })

    it('renders the assigned agent name', async () => {
      mockFetch(DEFAULT_TICKET, true, [DEFAULT_TICKET.assignedTo])
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('Assigned to')).toBeInTheDocument()
        expect(screen.getByTestId('assign-to-select')).toHaveTextContent('Bob Agent')
      })
    })

    it('shows "Unassigned" when no agent is assigned', async () => {
      mockFetch(TICKET_NO_ASSIGNED)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByTestId('assign-to-select')).toHaveTextContent('Unassigned')
      })
    })

    it('assigning an agent sends correct PATCH request and updates the Select', async () => {
      const user = userEvent.setup()
      mockFetch(TICKET_NO_ASSIGNED)
      renderTicketDetails()
      await screen.findByTestId('assign-to-select')
      const patchFetch = mockAssignFetch()
      await selectAgent(user, DEFAULT_TICKET.assignedTo!.name)

      await waitFor(() => {
        expect(patchFetch).toHaveBeenCalledWith(
          '/api/tickets/42',
          expect.objectContaining({
            method: 'PATCH',
            credentials: 'include',
            body: JSON.stringify({ assignedToId: DEFAULT_TICKET.assignedTo!.id }),
          }),
        )
        expect(screen.getByTestId('assign-to-select')).toHaveTextContent(DEFAULT_TICKET.assignedTo!.name)
      })
    })

    it('unassigning sends correct PATCH request and updates the Select', async () => {
      const user = userEvent.setup()
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()
      await screen.findByTestId('assign-to-select')
      const patchFetch = mockAssignFetch({ ticket: TICKET_NO_ASSIGNED })
      await selectAgent(user, 'Unassigned')

      await waitFor(() => {
        expect(patchFetch).toHaveBeenCalledWith(
          '/api/tickets/42',
          expect.objectContaining({
            method: 'PATCH',
            credentials: 'include',
            body: JSON.stringify({ assignedToId: null }),
          }),
        )
        expect(screen.getByTestId('assign-to-select')).toHaveTextContent('Unassigned')
      })
    })

    it('shows an error below the Select when the PATCH fails', async () => {
      const user = userEvent.setup()
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()
      await screen.findByTestId('assign-to-select')
      mockAssignFetch({ ok: false })
      await selectAgent(user, 'Carol Agent')

      await screen.findByText('Failed to update assignment')
    })

    it('renders the received date', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      const expectedDate = formatDate('2024-03-15T10:00:00.000Z')
      await waitFor(() => {
        expect(screen.getByText('Received')).toBeInTheDocument()
        expect(screen.getByText(expectedDate)).toBeInTheDocument()
      })
    })
  })

  describe('conversation', () => {
    it('renders the plain text body when htmlBody is null', async () => {
      mockFetch(DEFAULT_TICKET)
      renderTicketDetails()

      await waitFor(() => {
        expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
        expect(document.querySelector('iframe')).not.toBeInTheDocument()
      })
    })

    it('renders an iframe when htmlBody is present', async () => {
      mockFetch(TICKET_WITH_HTML_BODY)
      renderTicketDetails()

      await waitFor(() => {
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('title', 'Email body')
        expect(iframe).toHaveAttribute('srcDoc', '<p>HTML email body</p>')
      })
    })

    it('does not render the plain text body when htmlBody is present', async () => {
      mockFetch(TICKET_WITH_HTML_BODY)
      renderTicketDetails()

      await waitFor(() => {
        expect(document.querySelector('iframe')).toBeInTheDocument()
      })
      expect(screen.queryByText('Plain text body content.')).not.toBeInTheDocument()
    })
  })
})
