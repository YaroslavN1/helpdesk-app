import { waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { renderHookWithQueryClient } from '@/test-utils/render-with-query-client'
import { mockResolved } from '@/test-utils/mock-helpers'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from './useUsers'
import type { User } from '@/types/user'
import { USERS, NEW_USER } from '@/test-utils/fixtures'

// Mock shape lives in client/src/lib/__mocks__/api-client.ts (auto-used by Vitest)
vi.mock('@/lib/api-client')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useUsers', () => {
  it('fetches /users and returns the list', async () => {
    mockResolved(apiClient.get, { data: USERS })

    const { result } = renderHookWithQueryClient(() => useUsers())

    await waitFor(() => expect(result.current.data).toEqual(USERS))
    expect(apiClient.get).toHaveBeenCalledWith('/users')
  })
})

describe('useCreateUser', () => {
  it('appends the created user to the cached list with no follow-up GET', async () => {
    mockResolved(apiClient.post, { data: NEW_USER })

    const { result, queryClient } = renderHookWithQueryClient(() => useCreateUser())
    queryClient.setQueryData(['users'], USERS)

    await result.current.mutateAsync({
      name: NEW_USER.name,
      email: NEW_USER.email,
      password: 'password123',
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['users'])).toEqual([...USERS, NEW_USER])
    })
    expect(apiClient.post).toHaveBeenCalledWith('/users', {
      name: NEW_USER.name,
      email: NEW_USER.email,
      password: 'password123',
    })
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

describe('useUpdateUser', () => {
  it('replaces the matching cached entry by id with no follow-up GET', async () => {
    const updatedUser: User = {
      ...USERS[0],
      name: 'Updated Name',
      email: 'updated@example.com',
    }
    mockResolved(apiClient.patch, { data: updatedUser })

    const { result, queryClient } = renderHookWithQueryClient(() => useUpdateUser())
    queryClient.setQueryData(['users'], USERS)

    await result.current.mutateAsync({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['users'])).toEqual([updatedUser, USERS[1]])
    })
    expect(apiClient.patch).toHaveBeenCalledWith(`/users/${updatedUser.id}`, {
      name: updatedUser.name,
      email: updatedUser.email,
    })
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

describe('useDeleteUser', () => {
  it('removes the matching cached entry by id with no follow-up GET', async () => {
    mockResolved(apiClient.delete, { data: undefined })

    const { result, queryClient } = renderHookWithQueryClient(() => useDeleteUser())
    queryClient.setQueryData(['users'], USERS)

    await result.current.mutateAsync(USERS[1].id)

    await waitFor(() => {
      expect(queryClient.getQueryData(['users'])).toEqual([USERS[0]])
    })
    expect(apiClient.delete).toHaveBeenCalledWith(`/users/${USERS[1].id}`)
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})
