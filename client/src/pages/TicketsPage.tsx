import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { TicketsFilters } from '@/components/tickets/TicketsFilters'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { Pagination } from '@/components/ui/pagination'
import {
  TicketSortColumn,
  SortOrder,
  DEFAULT_PAGE_SIZE,
  type Ticket,
  type TicketsSortCriteria,
  type TicketsFilterCriteria,
  type TicketStatus,
  type TicketCategory,
  type PaginatedTickets,
} from '@helpdesk/core'

const defaultSort: TicketsSortCriteria = {
  column: TicketSortColumn.createdAt,
  order: SortOrder.desc,
}
const defaultPage = 1

type TicketsParams = { sort: TicketsSortCriteria; filters: TicketsFilterCriteria; page: number }

function getCurrentParams(params: URLSearchParams): TicketsParams {
  return {
    sort: {
      column: (params.get('sortBy') ?? defaultSort.column) as TicketSortColumn,
      order: (params.get('sortOrder') ?? defaultSort.order) as SortOrder,
    },
    filters: {
      search: params.get('search') ?? '',
      status: params.getAll('status') as TicketStatus[],
      category: params.getAll('category') as TicketCategory[],
    },
    page: params.get('page') !== null ? parseInt(params.get('page')!, 10) : defaultPage,
  }
}

function buildUrlParams({ sort, filters, page }: TicketsParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  //Default values are not stored in URL
  if (sort.column !== defaultSort.column) urlParams.set('sortBy', sort.column)
  if (sort.order !== defaultSort.order) urlParams.set('sortOrder', sort.order)
  if (page > defaultPage) urlParams.set('page', String(page))
  if (filters.search) urlParams.set('search', filters.search)
  for (const status of filters.status) urlParams.append('status', status)
  for (const category of filters.category) urlParams.append('category', category)
  return urlParams
}

export default function TicketsPage() {
  const [urlParams, setUrlParams] = useSearchParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { sort, filters, page } = getCurrentParams(urlParams)

  function fetchTickets({ sort, filters, page }: TicketsParams) {
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

  function applyParams(newParams: TicketsParams) {
    setUrlParams(buildUrlParams(newParams))
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
