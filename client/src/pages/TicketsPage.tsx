import { useEffect, useState } from 'react'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Pagination } from '@/components/ui/pagination'
import {
  appendFilterParams,
  defaultPage,
  useTicketsUrlParams,
  type TicketsParams,
} from '@/hooks/useTicketsUrlParams'
import {
  DEFAULT_PAGE_SIZE,
  type Ticket,
  type TicketsSortCriteria,
  type TicketsFilterCriteria,
  type PaginatedTickets,
} from '@helpdesk/core'

export default function TicketsPage() {
  const { sort, filters, page, setUrlParams } = useTicketsUrlParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchTickets({ sort, filters, page }: TicketsParams) {
    setLoading(true)
    setError(null)

    const query = new URLSearchParams()
    query.set('sortBy', sort.column)
    query.set('sortOrder', sort.order)
    query.set('page', String(page))
    query.set('pageSize', String(DEFAULT_PAGE_SIZE))
    appendFilterParams(query, filters)

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

  function applyParams(newParams: TicketsParams) {
    setUrlParams(newParams)
    fetchTickets(newParams)
  }

  function handleFiltersChange(newFilters: TicketsFilterCriteria) {
    applyParams({ sort, filters: newFilters, page: defaultPage })
  }

  function handleSortChange(newSort: TicketsSortCriteria) {
    applyParams({ sort: newSort, filters, page: defaultPage })
  }

  function handlePageChange(newPage: number) {
    applyParams({ sort, filters, page: newPage })
  }

  useEffect(() => {
    fetchTickets({ sort, filters, page })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
      </div>
      <TicketsFilters filters={filters} onFiltersChange={handleFiltersChange} loading={loading} />
      <TicketsTable
        tickets={tickets}
        loading={loading}
        error={error}
        sort={sort}
        onSortChange={handleSortChange}
      />
      <Pagination
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={total}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </>
  )
}
