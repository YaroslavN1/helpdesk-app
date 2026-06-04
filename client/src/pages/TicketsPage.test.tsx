import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TicketsPage from './TicketsPage'
import { TICKETS } from '@/test/fixtures'

function mockFetch(payload: typeof TICKETS | null = TICKETS, ok = true) {
  const fetchSpy = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(payload),
  })
  vi.stubGlobal('fetch', fetchSpy)
  return fetchSpy
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
    mockFetch()
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
    mockFetch()
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

describe('TicketsPage — filtering', () => {
  it('renders the search input and Status / Category filter buttons after the initial fetch resolves', async () => {
    mockFetch()
    render(<TicketsPage />)

    expect(screen.getByPlaceholderText('Search tickets…')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter')).toBeInTheDocument()
    expect(screen.getByTestId('category-filter')).toBeInTheDocument()
  })

  it('re-fetches with correct query params after typing in Search field', async () => {
    const user = userEvent.setup({ delay: null })
    const fetchSpy = mockFetch()
    render(<TicketsPage />)

    const searchInput = screen.getByPlaceholderText('Search tickets…')
    await user.type(searchInput, 'alice')

    // waitFor polls until the debounce (300 ms) fires and fetch is called.
    await waitFor(
      () => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some(url => url.includes('search=alice'))).toBe(true)
      },
      { timeout: 2000 },
    )
  })

  it('re-fetches with correct query params for "open" option selected in Status multiselect', async () => {
    const user = userEvent.setup({ delay: null })
    const fetchSpy = mockFetch()
    render(<TicketsPage />)

    const statusMultiselect = screen.getByTestId('status-filter')
    await waitFor(() => expect(statusMultiselect).not.toBeDisabled())
    await user.click(statusMultiselect)

    const openOption = await waitFor(
      () => screen.getAllByTestId('multiselect-item').find(el => el.textContent?.trim() === 'open')!,
      { timeout: 2000 },
    )

    await user.click(openOption)

    await waitFor(
      () => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some(url => url.includes('status=open'))).toBe(true)
      },
      { timeout: 2000 },
    )
  })

  it('re-fetches with correct query params for "General question" option selected in Category multiselect', async () => {
    const user = userEvent.setup({ delay: null })
    const fetchSpy = mockFetch()
    render(<TicketsPage />)

    const categoryMultiselect = screen.getByTestId('category-filter')
    await waitFor(() => expect(categoryMultiselect).not.toBeDisabled())
    await user.click(categoryMultiselect)

    const generalQuestionOption = await waitFor(
      () => screen.getAllByTestId('multiselect-item').find(el => el.textContent?.trim() === 'General question')!,
      { timeout: 2000 },
    )

    await user.click(generalQuestionOption)

    await waitFor(
      () => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some(url => url.includes('category=general_question'))).toBe(true)
      },
      { timeout: 2000 },
    )
  })

  it('re-fetches with the default URL after clicking Clear filters', async () => {
    const user = userEvent.setup({ delay: null })
    const fetchSpy = mockFetch()
    render(<TicketsPage />)

    const searchInput = screen.getByPlaceholderText('Search tickets…')
    await user.type(searchInput, 'alice')

    // Wait for the debounced search fetch to fire.
    await waitFor(
      () => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some(url => url.includes('search=alice'))).toBe(true)
      },
      { timeout: 2000 },
    )

    // Wait for the search-refetch to finish so the "Clear filters" button is enabled.
    await waitFor(() => expect(screen.getByRole('button', { name: /Clear filters/i })).not.toBeDisabled())

    const clearButton = screen.getByRole('button', { name: /Clear filters/i })
    await user.click(clearButton)

    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]
      expect(lastCall?.[0]).toBe('/api/tickets?sortBy=createdAt&sortOrder=desc')
    })
  })
})
