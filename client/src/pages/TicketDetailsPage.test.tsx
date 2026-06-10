import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router'
import TicketDetailsPage from './TicketDetailsPage'
import { TicketStatus, TicketCategory, type TicketDetails } from '@helpdesk/core'
import { formatDate } from '@/lib/utils'

const TICKET_FULL: TicketDetails = {
  id: 42,
  fromEmail: 'alice@example.com',
  fromName: 'Alice Smith',
  subject: 'Cannot log in to my account',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  assignedTo: { name: 'Bob Agent' },
  createdAt: '2024-03-15T10:00:00.000Z',
  body: 'Plain text body content.',
  htmlBody: null,
}

const TICKET_WITH_HTML_BODY: TicketDetails = {
  ...TICKET_FULL,
  id: 43,
  htmlBody: '<p>HTML email body</p>',
}

const TICKET_NO_ASSIGNED: TicketDetails = {
  ...TICKET_FULL,
  id: 44,
  assignedTo: null,
}

const TICKET_NO_CATEGORY: TicketDetails = {
  ...TICKET_FULL,
  id: 45,
  category: null,
}

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(payload),
    }),
  )
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

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('TicketDetailsPage', () => {
  it('renders the back link to /tickets', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderTicketDetails()

    const backLink = screen.getByRole('link', { name: '← Tickets' })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/tickets')
  })

  it('shows the skeleton while fetch is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderTicketDetails()

    expect(screen.getByTestId('ticket-detail-skeleton')).toBeInTheDocument()
  })

  it('does not render the error paragraph while fetch is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderTicketDetails()

    expect(screen.queryByText('Failed to load ticket')).not.toBeInTheDocument()
    expect(screen.queryByText('Ticket not found')).not.toBeInTheDocument()
  })

  it('calls the correct API endpoint with credentials include', () => {
    const fetchSpy = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fetchSpy)
    renderTicketDetails('42')

    expect(fetchSpy).toHaveBeenCalledWith('/api/tickets/42', { credentials: 'include' })
  })

  it('renders subject with #id prefix after successful fetch', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByText('#42')).toBeInTheDocument()
      expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
    })
  })

  it('renders status badge after successful fetch', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument()
    })
  })

  it('renders category badge after successful fetch', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByText('Technical question')).toBeInTheDocument()
    })
  })

  it('renders From metadata with name and email', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByText('From')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith <alice@example.com>')).toBeInTheDocument()
    })
  })

  it('renders Assigned to metadata with agent name', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByText('Assigned to')).toBeInTheDocument()
      expect(screen.getByText('Bob Agent')).toBeInTheDocument()
    })
  })

  it('renders Received metadata with formatted date', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    const expectedDate = formatDate('2024-03-15T10:00:00.000Z')
    await waitFor(() => {
      expect(screen.getByText('Received')).toBeInTheDocument()
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  it('renders the plain text body div when htmlBody is null', async () => {
    mockFetch(TICKET_FULL)
    renderTicketDetails()

    await waitFor(() => {
      expect(screen.getByText('Plain text body content.')).toBeInTheDocument()
      expect(document.querySelector('iframe')).not.toBeInTheDocument()
    })
  })

  it('renders an iframe when htmlBody is present', async () => {
    mockFetch(TICKET_WITH_HTML_BODY)
    renderTicketDetails('43')

    await waitFor(() => {
      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('title', 'Email body')
      expect(iframe).toHaveAttribute('srcDoc', '<p>HTML email body</p>')
    })
  })

  it('does not render plain text div when htmlBody is present', async () => {
    mockFetch(TICKET_WITH_HTML_BODY)
    renderTicketDetails('43')

    await waitFor(() => {
      expect(document.querySelector('iframe')).toBeInTheDocument()
    })
    // Plain text body should not be visible
    expect(screen.queryByText('Plain text body content.')).not.toBeInTheDocument()
  })

  it('shows "Unassigned" when assignedTo is null', async () => {
    mockFetch(TICKET_NO_ASSIGNED)
    renderTicketDetails('44')

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument()
    })
  })

  it('omits the category badge when category is null', async () => {
    mockFetch(TICKET_NO_CATEGORY)
    renderTicketDetails('45')

    await waitFor(() => {
      // Status badge is present
      expect(screen.getByText('Open')).toBeInTheDocument()
      // No category badge text should appear
      expect(screen.queryByText('Technical question')).not.toBeInTheDocument()
      expect(screen.queryByText('General question')).not.toBeInTheDocument()
      expect(screen.queryByText('Refund request')).not.toBeInTheDocument()
    })
  })

  it('hides ticket content and shows error when fetch returns non-ok', async () => {
    mockFetch(null, false)
    renderTicketDetails()

    await waitFor(() => expect(screen.getByText('Failed to load ticket')).toBeInTheDocument())
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('shows "Ticket not found" when fetch returns a 404 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve(null) }))
    renderTicketDetails()

    await waitFor(() =>
      expect(screen.getByText('Ticket not found')).toBeInTheDocument(),
    )
  })

})
