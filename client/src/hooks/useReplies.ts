import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ReplySchema } from '@helpdesk/core'
import type { CreateReplyInput } from '@helpdesk/core'

function repliesQueryKey(ticketId: number | undefined) {
  return ['ticket', ticketId, 'replies'] as const
}

export function useReplies(ticketId: number | undefined) {
  return useQuery({
    queryKey: repliesQueryKey(ticketId),
    queryFn: async () => {
      const response = await apiClient.get<ReplySchema[]>(`/tickets/${ticketId}/replies`)
      return response.data
    },
    enabled: ticketId !== undefined,
  })
}

export function useCreateReply(ticketId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateReplyInput) => {
      const response = await apiClient.post<ReplySchema>(`/tickets/${ticketId}/replies`, body)
      return response.data
    },
    onSuccess: (createdReply) => {
      queryClient.setQueryData<ReplySchema[]>(repliesQueryKey(ticketId), (previousReplies = []) => [
        ...previousReplies,
        createdReply,
      ])
    },
  })
}
