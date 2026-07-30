import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { type AgentOption } from '@helpdesk/core'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get<AgentOption[]>('/users/agents')
      return response.data
    },
  })
}
