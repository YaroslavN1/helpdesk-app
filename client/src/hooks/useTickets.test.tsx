import { waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderHookWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved } from '@/test-utils/mock-helpers'
import { useTickets } from './useTickets'
import { PAGINATED_TICKETS } from '@/test-utils/fixtures'
import { TicketSortColumn, SortOrder, TicketStatus, TicketCategory } from '@helpdesk/core'
import { buildRequestQuery, type TicketsParams } from './useTicketsUrlParams'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTickets', () => {
  it('fetches /tickets using the query string and returns the response data', async () => {
    mockResolved(apiClient.get, { data: PAGINATED_TICKETS })

    //Params are tested only for being included into the request query, not related to returned data
    const params: TicketsParams = {
      sort: { column: TicketSortColumn.subject, order: SortOrder.asc },
      filters: {
        search: 'refund',
        status: [TicketStatus.open],
        category: [TicketCategory.refund_request],
      },
      page: 2,
    }

    const { result } = renderHookWithQueryClient(() => useTickets(params))

    await waitFor(() => expect(result.current.data).toEqual(PAGINATED_TICKETS))

    expect(apiClient.get).toHaveBeenCalledWith(`/tickets?${buildRequestQuery(params)}`)
  })
})
