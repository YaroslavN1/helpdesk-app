import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { type Agent } from '@helpdesk/core'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get<Agent[]>('/users/agents')
      return response.data
    },
  })
}
