import { useEffect, useState } from 'react'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { SortColumn, SortOrder, type Ticket, type TicketsSort, type TicketsFilters as FiltersState } from '@helpdesk/core'

const defaultSort: TicketsSort = { column: SortColumn.createdAt, order: SortOrder.desc }

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<{ sort: TicketsSort; filters: FiltersState }>({ sort: defaultSort, filters: {} })

  function fetchTickets(sort: TicketsSort, filters: FiltersState = {}) {
    setLoading(true)
    setError(null)

    const query = new URLSearchParams()
    query.set('sortBy', sort.column)
    query.set('sortOrder', sort.order)

    if (filters.search) query.set('search', filters.search)
    for (const status of (filters.status ?? [])) query.append('status', status)
    for (const category of (filters.category ?? [])) query.append('category', category)

    fetch(`/api/tickets?${query}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tickets')
        return res.json() as Promise<Ticket[]>
      })
      .then(setTickets)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }

  function handleSortChange(sort: TicketsSort) {
    setParams(prev => ({ ...prev, sort }))
    fetchTickets(sort, params.filters)
  }

  function handleFiltersChange(filters: FiltersState) {
    setParams(prev => ({ ...prev, filters }))
    fetchTickets(params.sort, filters)
  }

  useEffect(() => {
    fetchTickets(defaultSort)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
      </div>
      <TicketsFilters filters={params.filters} onFiltersChange={handleFiltersChange} loading={loading} />
      <TicketsTable
        tickets={tickets}
        loading={loading}
        error={error}
        sort={params.sort}
        onSortChange={handleSortChange}
      />
    </>
  )
}
