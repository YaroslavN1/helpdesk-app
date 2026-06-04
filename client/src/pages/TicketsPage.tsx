import { useEffect, useState } from 'react'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Pagination } from '@/components/ui/pagination'
import {
  SortColumn,
  SortOrder,
  DEFAULT_PAGE_SIZE,
  DEFAULT_FILTERS,
  type Ticket,
  type TicketsSort,
  type TicketsFilters as FiltersState,
  type PaginatedTickets,
} from '@helpdesk/core'

const defaultSort: TicketsSort = { column: SortColumn.createdAt, order: SortOrder.desc }

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<{ sort: TicketsSort; filters: FiltersState; page: number }>({
    sort: defaultSort,
    filters: DEFAULT_FILTERS,
    page: 1,
  })

  function fetchTickets(sort: TicketsSort, filters: FiltersState = DEFAULT_FILTERS, page = 1) {
    setLoading(true)
    setError(null)

    const query = new URLSearchParams()
    query.set('sortBy', sort.column)
    query.set('sortOrder', sort.order)
    query.set('page', String(page))
    query.set('pageSize', String(DEFAULT_PAGE_SIZE))

    if (filters.search) query.set('search', filters.search)
    for (const status of filters.status) query.append('status', status)
    for (const category of filters.category) query.append('category', category)

    fetch(`/api/tickets?${query}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tickets')
        return res.json() as Promise<PaginatedTickets>
      })
      .then((data) => {
        setTickets(data.tickets)
        setTotal(data.total)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false))
  }

  function handleSortChange(sort: TicketsSort) {
    setParams(prev => ({ ...prev, sort, page: 1 }))
    fetchTickets(sort, params.filters, 1)
  }

  function handleFiltersChange(filters: FiltersState) {
    setParams(prev => ({ ...prev, filters, page: 1 }))
    fetchTickets(params.sort, filters, 1)
  }

  function handlePageChange(page: number) {
    setParams(prev => ({ ...prev, page }))
    fetchTickets(params.sort, params.filters, page)
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
      <Pagination
        page={params.page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={total}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </>
  )
}
