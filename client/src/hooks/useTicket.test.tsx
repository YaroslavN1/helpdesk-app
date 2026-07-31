import { waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderHookWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved } from '@/test-utils/mock-helpers'
import { useTicket, useUpdateTicket } from './useTicket'
import { openTechnicalTicketDetails } from '@/test-utils/fixtures'
import { TicketStatus } from '@helpdesk/core'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTicket', () => {
  it('fetches /tickets/:id and returns the ticket', async () => {
    mockResolved(apiClient.get, { data: openTechnicalTicketDetails })

    const { result } = renderHookWithQueryClient(() => useTicket('1'))

    await waitFor(() => expect(result.current.data).toEqual(openTechnicalTicketDetails))
    expect(apiClient.get).toHaveBeenCalledWith('/tickets/1')
  })

  it('does not fetch when id is undefined', () => {
    mockResolved(apiClient.get, { data: openTechnicalTicketDetails })

    const { result } = renderHookWithQueryClient(() => useTicket(undefined))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

describe('useUpdateTicket', () => {
  it('writes the updated ticket into the cached entry with no follow-up GET', async () => {
    const updatedTicket = { ...openTechnicalTicketDetails, status: TicketStatus.resolved }
    mockResolved(apiClient.patch, { data: updatedTicket })

    const { result, queryClient } = renderHookWithQueryClient(() => useUpdateTicket('1'))
    queryClient.setQueryData(['ticket', '1'], openTechnicalTicketDetails)

    await result.current.mutateAsync({ status: TicketStatus.resolved })

    await waitFor(() => {
      expect(queryClient.getQueryData(['ticket', '1'])).toEqual(updatedTicket)
    })
    expect(apiClient.patch).toHaveBeenCalledWith('/tickets/1', { status: TicketStatus.resolved })
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})
