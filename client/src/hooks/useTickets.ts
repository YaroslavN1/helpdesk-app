import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { buildRequestQuery, type TicketsParams } from '@/hooks/useTicketsUrlParams'
import { type PaginatedTickets } from '@helpdesk/core'

export function useTickets({ sort, filters, page }: TicketsParams) {
  return useQuery({
    queryKey: ['tickets', sort, filters, page],
    queryFn: async () => {
      const query = buildRequestQuery({ sort, filters, page })

      const response = await apiClient.get<PaginatedTickets>(`/tickets?${query}`)
      return response.data
    },
  })
}
