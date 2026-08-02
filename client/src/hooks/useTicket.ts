import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { type TicketDetails, type UpdateTicketInput } from '@helpdesk/core'

function ticketQueryKey(id: string | undefined) {
  return ['ticket', id] as const
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ticketQueryKey(id),
    queryFn: async () => {
      const response = await apiClient.get<TicketDetails>(`/tickets/${id}`)
      return response.data
    },
    enabled: id !== undefined,
  })
}

export function useUpdateTicket(id: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: UpdateTicketInput) => {
      const response = await apiClient.patch<TicketDetails>(`/tickets/${id}`, body)
      return response.data
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(ticketQueryKey(id), updatedTicket)
    },
  })
}
