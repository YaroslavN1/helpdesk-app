import { useSearchParams } from 'react-router'
import {
  TicketSortColumn,
  SortOrder,
  type TicketsSortCriteria,
  type TicketsFilterCriteria,
  type TicketStatus,
  type TicketCategory,
} from '@helpdesk/core'

export type TicketsParams = {
  sort: TicketsSortCriteria
  filters: TicketsFilterCriteria
  page: number
}

export const defaultSort: TicketsSortCriteria = {
  column: TicketSortColumn.createdAt,
  order: SortOrder.desc,
}
export const defaultPage = 1

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

// Shared by buildUrlParams and the /api/tickets query builder in TicketsPage.
export function appendFilterParams(urlParams: URLSearchParams, filters: TicketsFilterCriteria) {
  if (filters.search) urlParams.set('search', filters.search)
  for (const status of filters.status) urlParams.append('status', status)
  for (const category of filters.category) urlParams.append('category', category)
}

export function buildUrlParams({ sort, filters, page }: TicketsParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  if (sort.column !== defaultSort.column) urlParams.set('sortBy', sort.column)
  if (sort.order !== defaultSort.order) urlParams.set('sortOrder', sort.order)
  if (page > defaultPage) urlParams.set('page', String(page))
  appendFilterParams(urlParams, filters)
  return urlParams
}

export function useTicketsUrlParams() {
  const [urlParams, setUrlParams] = useSearchParams()

  return {
    ...getCurrentParams(urlParams),
    setUrlParams: (params: TicketsParams) => setUrlParams(buildUrlParams(params)),
  }
}
