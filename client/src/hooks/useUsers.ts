import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { type User } from '@/types/user'
import { type CreateUserInput, type EditUserInput } from '@helpdesk/core'

type UpdateUserInput = EditUserInput & { id: string }

const usersQueryKey = ['users'] as const

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: async () => {
      const response = await apiClient.get<User[]>('/users')
      return response.data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await apiClient.post<User>('/users', input)
      return response.data
    },
    onSuccess: (createdUser) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (previousUsers = []) => [
        ...previousUsers,
        createdUser,
      ])
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateUserInput) => {
      const response = await apiClient.patch<User>(`/users/${id}`, body)
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (previousUsers = []) =>
        previousUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
      )
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`)
    },
    onSuccess: (_data, deletedUserId) => {
      queryClient.setQueryData<User[]>(usersQueryKey, (previousUsers = []) =>
        previousUsers.filter((user) => user.id !== deletedUserId),
      )
    },
  })
}
