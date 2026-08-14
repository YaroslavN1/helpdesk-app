import { waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderHookWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved } from '@/test-utils/mock-helpers'
import { useReplies, useCreateReply } from './useReplies'
import { SenderType, type ReplySchema } from '@helpdesk/core'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

const CUSTOMER_REPLY: ReplySchema = {
  id: 1,
  body: 'My printer is still broken.',
  htmlBody: null,
  senderType: SenderType.customer,
  createdAt: '2024-03-15T10:05:00.000Z',
  user: null,
}

const AGENT_REPLY: ReplySchema = {
  id: 2,
  body: 'Have you tried turning it off and on again?',
  htmlBody: '<p>Have you tried turning it off and on again?</p>',
  senderType: SenderType.agent,
  createdAt: '2024-03-15T11:00:00.000Z',
  user: { id: 'agent-1', name: 'Bob Agent' },
}

const REPLIES: ReplySchema[] = [CUSTOMER_REPLY, AGENT_REPLY]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useReplies', () => {
  it('fetches /tickets/:id/replies and returns the list', async () => {
    mockResolved(apiClient.get, { data: REPLIES })

    const { result } = renderHookWithQueryClient(() => useReplies(1))

    await waitFor(() => expect(result.current.data).toEqual(REPLIES))
    expect(apiClient.get).toHaveBeenCalledWith('/tickets/1/replies')
  })

  it('does not fetch when ticketId is undefined', () => {
    mockResolved(apiClient.get, { data: REPLIES })

    const { result } = renderHookWithQueryClient(() => useReplies(undefined))

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

describe('useCreateReply', () => {
  it('appends the created reply to the cached list with no follow-up GET', async () => {
    mockResolved(apiClient.post, { data: AGENT_REPLY })

    const { result, queryClient } = renderHookWithQueryClient(() => useCreateReply(1))
    queryClient.setQueryData(['ticket', 1, 'replies'], [CUSTOMER_REPLY])

    await result.current.mutateAsync({ body: AGENT_REPLY.body })

    await waitFor(() => {
      expect(queryClient.getQueryData(['ticket', 1, 'replies'])).toEqual([
        CUSTOMER_REPLY,
        AGENT_REPLY,
      ])
    })
    expect(apiClient.post).toHaveBeenCalledWith('/tickets/1/replies', { body: AGENT_REPLY.body })
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('initializes the cache with just the created reply when no prior entry exists', async () => {
    mockResolved(apiClient.post, { data: CUSTOMER_REPLY })

    const { result, queryClient } = renderHookWithQueryClient(() => useCreateReply(1))

    await result.current.mutateAsync({ body: CUSTOMER_REPLY.body })

    await waitFor(() => {
      expect(queryClient.getQueryData(['ticket', 1, 'replies'])).toEqual([CUSTOMER_REPLY])
    })
  })
})
