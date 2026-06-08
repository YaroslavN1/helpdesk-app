import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import TicketsPage from './TicketsPage'
import { TICKETS } from '@/test/fixtures'

function renderTicketsPage(url = '/') {
  return render(<MemoryRouter initialEntries={[url]}><TicketsPage /></MemoryRouter>)
}

const PAGINATED_TICKETS = { tickets: TICKETS, total: TICKETS.length }

function mockFetchTickets(payload: typeof PAGINATED_TICKETS | null = PAGINATED_TICKETS, ok = true) {
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
    renderTicketsPage()

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/tickets?sortBy=createdAt&sortOrder=desc&page=1&pageSize=10',
      { credentials: 'include' },
    )
  })

  it('shows skeleton rows while fetch is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderTicketsPage()

    expect(document.querySelectorAll('tbody tr')).toHaveLength(4)
  })

  it('hides skeleton rows after fetch resolves', async () => {
    mockFetchTickets()
    renderTicketsPage()

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

    expect(document.querySelectorAll('tbody tr')).toHaveLength(TICKETS.length)
  })

  it('renders the page heading', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderTicketsPage()

    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
  })

  it('renders ticket rows after fetch resolves successfully', async () => {
    mockFetchTickets()
    renderTicketsPage()

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Cannot log in to my account')).toBeInTheDocument()
      expect(screen.getByText('Carol Jones')).toBeInTheDocument()
      expect(screen.getByText('I need a refund')).toBeInTheDocument()
    })
  })

  it('shows an error message when fetch returns a non-ok response', async () => {
    mockFetchTickets(null, false)
    renderTicketsPage()

    await waitFor(() =>
      expect(screen.getByText('Failed to load tickets')).toBeInTheDocument(),
    )
  })

  it('shows an error message when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    renderTicketsPage()

    await waitFor(() =>
      expect(screen.getByText('Network error')).toBeInTheDocument(),
    )
  })
})

describe('TicketsPage — filtering', () => {
  it('renders the Search input and Status / Category multiselect filetrs after the initial fetch resolves', async () => {
    mockFetchTickets()
    renderTicketsPage()

    expect(screen.getByTestId('search-input')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter')).toBeInTheDocument()
    expect(screen.getByTestId('category-filter')).toBeInTheDocument()
  })

  it('re-fetches with correct query params after typing in Search field', async () => {
    const user = userEvent.setup({ delay: null })
    const fetchSpy = mockFetchTickets()
    renderTicketsPage()

    const searchInput = screen.getByTestId('search-input')
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
    const user = userEvent.setup()
    const fetchSpy = mockFetchTickets()
    renderTicketsPage()

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
    const user = userEvent.setup()
    const fetchSpy = mockFetchTickets()
    renderTicketsPage()

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
    const fetchSpy = mockFetchTickets()
    renderTicketsPage()

    const searchInput = screen.getByTestId('search-input')
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
      expect(lastCall?.[0]).toBe('/api/tickets?sortBy=createdAt&sortOrder=desc&page=1&pageSize=10')
    })
  })
})

describe('TicketsPage — pagination', () => {
  it('does not render pagination when total fits on one page', async () => {
    mockFetchTickets({ tickets: TICKETS, total: TICKETS.length })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

    expect(screen.queryByTestId('pagination-summary')).not.toBeInTheDocument()
  })

  it('renders pagination summary when there are multiple pages', async () => {
    mockFetchTickets({ tickets: TICKETS, total: 50 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'))
  })

  it('re-fetches with page=2 when the second page button is clicked', async () => {
    const user = userEvent.setup()
    const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'))

    await user.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map(([url]) => url as string)
      expect(calls.some(url => url.includes('page=2'))).toBe(true)
    })
  })

  it('previous button is disabled on page 1', async () => {
    mockFetchTickets({ tickets: TICKETS, total: 50 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'))

    const prevButton = Array.from(document.querySelectorAll('button')).find(
      button => button.querySelector('.lucide-chevron-left'),
    )
    expect(prevButton).toBeDefined()
    expect(prevButton).toBeDisabled()
  })

  it('re-fetches with page=2 when the next button is clicked', async () => {
    const user = userEvent.setup()
    const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'))

    const nextButton = Array.from(document.querySelectorAll('button')).find(
      button => button.querySelector('.lucide-chevron-right'),
    )!
    await user.click(nextButton)

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map(([url]) => url as string)
      expect(calls.some(url => url.includes('page=2'))).toBe(true)
    })
  })

  it('re-fetches with page=1 when the previous button is clicked from page 2', async () => {
    const user = userEvent.setup()
    const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'))

    await user.click(screen.getByRole('button', { name: '2' }))
    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 11–20 of 50'))

    const prevButton = Array.from(document.querySelectorAll('button')).find(
      button => button.querySelector('.lucide-chevron-left'),
    )!
    await user.click(prevButton)

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map(([url]) => url as string)
      expect(calls.some(url => url.includes('page=1'))).toBe(true)
    })
  })

  it('next button is disabled on the last page', async () => {
    const user = userEvent.setup()
    mockFetchTickets({ tickets: TICKETS, total: 20 })
    renderTicketsPage()

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 20'))

    await user.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 11–20 of 20'))

    const nextButton = Array.from(document.querySelectorAll('button')).find(
      button => button.querySelector('.lucide-chevron-right'),
    )
    expect(nextButton).toBeDefined()
    expect(nextButton).toBeDisabled()
  })
})

describe('TicketsPage — URL restoration on refresh', () => {
  it('restores sort column and order from URL', () => {
    const fetchSpy = mockFetchTickets()
    renderTicketsPage('/tickets?sortBy=subject&sortOrder=asc')

    const firstUrl = fetchSpy.mock.calls[0][0] as string
    expect(firstUrl).toContain('sortBy=subject')
    expect(firstUrl).toContain('sortOrder=asc')
  })

  it('restores search filter from URL', () => {
    const fetchSpy = mockFetchTickets()
    renderTicketsPage('/tickets?search=alice')

    const firstUrl = fetchSpy.mock.calls[0][0] as string
    expect(firstUrl).toContain('search=alice')
  })

  it('restores status filter from URL', () => {
    const fetchSpy = mockFetchTickets()
    renderTicketsPage('/tickets?status=open')

    const firstUrl = fetchSpy.mock.calls[0][0] as string
    expect(firstUrl).toContain('status=open')
  })

  it('restores category filter from URL', () => {
    const fetchSpy = mockFetchTickets()
    renderTicketsPage('/tickets?category=general_question')

    const firstUrl = fetchSpy.mock.calls[0][0] as string
    expect(firstUrl).toContain('category=general_question')
  })

  it('restores page from URL', () => {
    const fetchSpy = mockFetchTickets()
    renderTicketsPage('/tickets?page=3')

    const firstUrl = fetchSpy.mock.calls[0][0] as string
    expect(firstUrl).toContain('page=3')
  })
})
