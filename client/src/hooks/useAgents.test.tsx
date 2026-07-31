import { waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderHookWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved } from '@/test-utils/mock-helpers'
import { AGENTS } from '@/test-utils/fixtures'
import { useAgents } from './useAgents'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAgents', () => {
  it('fetches /users/agents and returns the list', async () => {
    mockResolved(apiClient.get, { data: AGENTS })

    const { result } = renderHookWithQueryClient(() => useAgents())

    await waitFor(() => expect(result.current.data).toEqual(AGENTS))
    expect(apiClient.get).toHaveBeenCalledWith('/users/agents')
  })
})
