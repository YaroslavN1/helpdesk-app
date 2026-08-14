import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Reply } from '@helpdesk/core'
import type { CreateReplyInput } from '@helpdesk/core'
import { ticketQueryKey } from './useTicket'

function repliesQueryKey(ticketId: number | undefined) {
  return ['ticket', ticketId, 'replies'] as const
}

export function useReplies(ticketId: number | undefined) {
  return useQuery({
    queryKey: repliesQueryKey(ticketId),
    queryFn: async () => {
      const response = await apiClient.get<Reply[]>(`/tickets/${ticketId}/replies`)
      return response.data
    },
    enabled: ticketId !== undefined,
  })
}

export function useCreateReply(ticketId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateReplyInput) => {
      const response = await apiClient.post<Reply>(`/tickets/${ticketId}/replies`, body)
      return response.data
    },
    onSuccess: (createdReply) => {
      queryClient.setQueryData<Reply[]>(repliesQueryKey(ticketId), (previousReplies = []) => [
        ...previousReplies,
        createdReply,
      ])
      queryClient.invalidateQueries({ queryKey: ticketQueryKey(String(ticketId)) })
    },
  })
}
