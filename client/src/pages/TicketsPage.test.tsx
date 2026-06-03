import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TicketsPage from './TicketsPage'
import { TICKETS } from '@/test/fixtures'

function mockFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(payload),
    }),
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('TicketsPage', () => {
  it('calls /api/tickets with credentials include', () => {
    const fetchSpy = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fetchSpy)
    render(<TicketsPage />)

    expect(fetchSpy).toHaveBeenCalledWith('/api/tickets?sortBy=createdAt&sortOrder=desc', { credentials: 'include' })
  })

  it('shows skeleton rows while fetch is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<TicketsPage />)

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })

  it('hides skeleton rows after fetch resolves', async () => {
    mockFetch(TICKETS)
    render(<TicketsPage />)

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

    expect(document.querySelectorAll('tbody tr')).toHaveLength(TICKETS.length)
  })

  it('renders the page heading', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<TicketsPage />)

    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
  })

  it('renders ticket rows after fetch resolves successfully', async () => {
    mockFetch(TICKETS)
    render(<TicketsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
      expect(screen.getByText('Carol Jones')).toBeInTheDocument()
      expect(screen.getByText('I need a refund')).toBeInTheDocument()
    })
  })

  it('shows an error message when fetch returns a non-ok response', async () => {
    mockFetch(null, false)
    render(<TicketsPage />)

    await waitFor(() =>
      expect(screen.getByText('Failed to load tickets')).toBeInTheDocument(),
    )
  })

  it('shows an error message when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<TicketsPage />)

    await waitFor(() =>
      expect(screen.getByText('Network error')).toBeInTheDocument(),
    )
  })
})
