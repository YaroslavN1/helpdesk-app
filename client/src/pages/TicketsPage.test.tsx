import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router'
import { apiClient } from '@/lib/api-client'
import { renderWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved, mockRejected, mockPending } from '@/test-utils/mock-helpers'
import TicketsPage from './TicketsPage'
import { TICKETS, PAGINATED_TICKETS } from '@/test-utils/fixtures'
import type { PaginatedTickets } from '@helpdesk/core'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

function renderTicketsPage(url = '/') {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={[url]}>
      <TicketsPage />
    </MemoryRouter>,
  )
}

function getPaginationButton(name: string) {
  if (name === 'Previous page') return screen.getByTestId('pagination-prev')
  if (name === 'Next page') return screen.getByTestId('pagination-next')
  return within(screen.getByTestId('pagination-buttons')).getByRole('button', {
    name,
  })
}

function mockFetchTickets(payload: PaginatedTickets | null = PAGINATED_TICKETS) {
  mockResolved(apiClient.get, { data: payload })
  return vi.mocked(apiClient.get)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TicketsPage', () => {
  describe('page header', () => {
    it('renders the page heading', () => {
      mockPending(apiClient.get)
      renderTicketsPage()

      expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('calls /tickets with the correct query string', () => {
      mockPending(apiClient.get)
      renderTicketsPage()

      expect(apiClient.get).toHaveBeenCalledWith(
        '/tickets?sortBy=createdAt&sortOrder=desc&page=1&pageSize=10',
      )
    })

    it('shows skeleton while loading', () => {
      mockPending(apiClient.get)
      renderTicketsPage()

      expect(screen.getAllByTestId('tickets-table-skeleton')[0]).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows the server error message when the response contains an error field', async () => {
      mockRejected(apiClient.get, {
        isAxiosError: true,
        response: { status: 500, data: { error: 'Something went wrong' } },
      })
      renderTicketsPage()

      await waitFor(() => expect(screen.getByText('Something went wrong')).toBeInTheDocument())
    })

    it('shows a fallback error message when fetch rejects with no server message', async () => {
      mockRejected(apiClient.get, { isAxiosError: true, response: undefined })
      renderTicketsPage()

      await waitFor(() => expect(screen.getByText('Failed to load tickets')).toBeInTheDocument())
    })
  })

  describe('empty state', () => {
    it('shows "No tickets yet." when the fetch resolves with an empty list', async () => {
      mockFetchTickets({ tickets: [], total: 0 })
      renderTicketsPage()

      await waitFor(() => expect(screen.getByText('No tickets yet.')).toBeInTheDocument())
    })
  })

  describe('loaded state', () => {
    it('renders ticket rows after fetch resolves successfully', async () => {
      mockFetchTickets()
      renderTicketsPage()

      await waitFor(() => {
        expect(screen.queryAllByTestId('tickets-table-skeleton')).toHaveLength(0)
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      })
    })
  })

  describe('filtering', () => {
    it('renders the Search input and Status / Category multiselect filters after the initial fetch resolves', async () => {
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
      await waitFor(() => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some((url) => url.includes('search=alice'))).toBe(true)
      })
    })

    it('re-fetches with correct query params for "open" option selected in Status multiselect', async () => {
      const user = userEvent.setup()
      const fetchSpy = mockFetchTickets()
      renderTicketsPage()

      const statusMultiselect = screen.getByTestId('status-filter')
      await waitFor(() => expect(statusMultiselect).not.toBeDisabled())
      await user.click(statusMultiselect)

      const openOption = await waitFor(() =>
        screen.getAllByTestId('multiselect-item').find((el) => el.textContent?.trim() === 'Open')!,
      )

      await user.click(openOption)

      await waitFor(() => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some((url) => url.includes('status=open'))).toBe(true)
      })
    })

    it('re-fetches with correct query params for "General" option selected in Category multiselect', async () => {
      const user = userEvent.setup()
      const fetchSpy = mockFetchTickets()
      renderTicketsPage()

      const categoryMultiselect = screen.getByTestId('category-filter')
      await waitFor(() => expect(categoryMultiselect).not.toBeDisabled())
      await user.click(categoryMultiselect)

      const generalQuestionOption = await waitFor(() =>
        screen
          .getAllByTestId('multiselect-item')
          .find((el) => el.textContent?.trim() === 'General')!,
      )

      await user.click(generalQuestionOption)

      await waitFor(() => {
        const calls = fetchSpy.mock.calls.map(([url]) => url as string)
        expect(calls.some((url) => url.includes('category=general_question'))).toBe(true)
      })
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
          expect(calls.some((url) => url.includes('search=alice'))).toBe(true)
        },
        { timeout: 2000 },
      )

      // Wait for the search-refetch to finish so the "Clear filters" button is enabled.
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Clear filters/i })).not.toBeDisabled(),
      )

      const clearButton = screen.getByRole('button', { name: /Clear filters/i })
      await user.click(clearButton)

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]
        expect(lastCall?.[0]).toBe('/tickets?sortBy=createdAt&sortOrder=desc&page=1&pageSize=10')
      })
    })
  })

  describe('pagination', () => {
    describe('pagination buttons', () => {
      it('renders pagination buttons when there are multiple pages', async () => {
        mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => {
          expect(screen.getByTestId('pagination-buttons')).toBeInTheDocument()
        })
      })

      it('does not render pagination buttons when total fits on one page', async () => {
        mockFetchTickets()
        renderTicketsPage()

        await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

        expect(screen.queryByTestId('pagination-buttons')).not.toBeInTheDocument()
      })

      it('re-fetches with correct query params when the second page button is clicked', async () => {
        const user = userEvent.setup()
        const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => expect(getPaginationButton('2')).not.toBeDisabled())

        await user.click(getPaginationButton('2'))

        await waitFor(() => {
          const calls = fetchSpy.mock.calls.map(([url]) => url as string)
          expect(calls.some((url) => url.includes('page=2'))).toBe(true)
        })
      })

      it('clicking the current page button does not trigger a re-fetch', async () => {
        const user = userEvent.setup()
        const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => expect(getPaginationButton('1')).not.toBeDisabled())

        const callCountBefore = fetchSpy.mock.calls.length
        await user.click(getPaginationButton('1'))

        expect(fetchSpy.mock.calls.length).toBe(callCountBefore)
      })

      it('re-fetches with correct query params when the previous button is clicked', async () => {
        const user = userEvent.setup()
        const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage('/tickets?page=2')

        await waitFor(() => expect(getPaginationButton('Previous page')).not.toBeDisabled())

        await user.click(getPaginationButton('Previous page'))

        await waitFor(() => {
          const calls = fetchSpy.mock.calls.map(([url]) => url as string)
          expect(calls.some((url) => url.includes('page=1'))).toBe(true)
        })
      })

      it('"Previous page" button is disabled on page 1', async () => {
        mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => expect(getPaginationButton('Previous page')).toBeDisabled())
      })

      it('re-fetches with correct query params when the next button is clicked', async () => {
        const user = userEvent.setup()
        const fetchSpy = mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => expect(getPaginationButton('Next page')).not.toBeDisabled())

        await user.click(getPaginationButton('Next page'))

        await waitFor(() => {
          const calls = fetchSpy.mock.calls.map(([url]) => url as string)
          expect(calls.some((url) => url.includes('page=2'))).toBe(true)
        })
      })

      it('"Next page" button is disabled on the last page', async () => {
        const user = userEvent.setup()
        mockFetchTickets({ tickets: TICKETS, total: 20 })
        renderTicketsPage()

        await waitFor(() => expect(getPaginationButton('2')).not.toBeDisabled())

        await user.click(getPaginationButton('2'))

        await waitFor(() => expect(getPaginationButton('Next page')).toBeDisabled())
      })
    })

    describe('pagination summary', () => {
      it('renders the pagination summary when there are multiple pages', async () => {
        mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() => {
          expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50')
        })
      })

      it('does not render the pagination summary when total fits on one page', async () => {
        mockFetchTickets()
        renderTicketsPage()

        await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument())

        expect(screen.queryByTestId('pagination-summary')).not.toBeInTheDocument()
      })

      it('updates pagination summary text when navigating to another page', async () => {
        const user = userEvent.setup()
        mockFetchTickets({ tickets: TICKETS, total: 50 })
        renderTicketsPage()

        await waitFor(() =>
          expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 1–10 of 50'),
        )

        await user.click(getPaginationButton('2'))

        await waitFor(() =>
          expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Showing 11–20 of 50'),
        )
      })
    })
  })

  describe('URL restoration on refresh', () => {
    it('wires all URL search params into the fetch query', () => {
      const fetchSpy = mockFetchTickets()
      renderTicketsPage(
        '/tickets?sortBy=subject&sortOrder=asc&search=alice&status=open&category=general_question&page=3',
      )

      const firstUrl = fetchSpy.mock.calls[0][0] as string
      expect(firstUrl).toContain('sortBy=subject')
      expect(firstUrl).toContain('sortOrder=asc')
      expect(firstUrl).toContain('search=alice')
      expect(firstUrl).toContain('status=open')
      expect(firstUrl).toContain('category=general_question')
      expect(firstUrl).toContain('page=3')
    })
  })
})
