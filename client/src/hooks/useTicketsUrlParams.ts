import { useSearchParams } from 'react-router'
import {
  TicketSortColumn,
  SortOrder,
  type TicketsSortCriteria,
  type TicketsFilterCriteria,
  type TicketStatus,
  type TicketCategory,
} from '@helpdesk/core'
import { DEFAULT_PAGE_SIZE } from '@helpdesk/core'

export type TicketsParams = {
  sort: TicketsSortCriteria
  filters: TicketsFilterCriteria
  page: number
}

export const defaultPage = 1
export const defaultSort: TicketsSortCriteria = {
  column: TicketSortColumn.createdAt,
  order: SortOrder.desc,
}
export const defaultFilters: TicketsFilterCriteria = {
  search: '',
  status: [],
  category: [],
}

function getCurrentParams(params: URLSearchParams): TicketsParams {
  return {
    sort: {
      column: (params.get('sortBy') ?? defaultSort.column) as TicketSortColumn,
      order: (params.get('sortOrder') ?? defaultSort.order) as SortOrder,
    },
    filters: {
      search: params.get('search') ?? defaultFilters.search,
      status: params.getAll('status') as TicketStatus[],
      category: params.getAll('category') as TicketCategory[],
    },
    page: params.get('page') !== null ? parseInt(params.get('page')!, 10) : defaultPage,
  }
}

function appendFiltersQuery(query: URLSearchParams, filters: TicketsFilterCriteria) {
  if (filters.search) query.set('search', filters.search)
  for (const status of filters.status) query.append('status', status)
  for (const category of filters.category) query.append('category', category)
}

//Default values are omitted in URL
function buildUrlQuery({ sort, filters, page }: TicketsParams): URLSearchParams {
  const urlQuery = new URLSearchParams()
  if (sort.column !== defaultSort.column) urlQuery.set('sortBy', sort.column)
  if (sort.order !== defaultSort.order) urlQuery.set('sortOrder', sort.order)
  if (page > defaultPage) urlQuery.set('page', String(page))
  appendFiltersQuery(urlQuery, filters)
  return urlQuery
}

export function buildRequestQuery({ sort, filters, page }: TicketsParams): URLSearchParams {
  const requestQuery = new URLSearchParams()
  requestQuery.set('sortBy', sort.column)
  requestQuery.set('sortOrder', sort.order)
  requestQuery.set('page', String(page))
  requestQuery.set('pageSize', String(DEFAULT_PAGE_SIZE))
  appendFiltersQuery(requestQuery, filters)
  return requestQuery
}

export function useTicketsUrlParams() {
  const [urlParams, setUrlParams] = useSearchParams()

  return {
    ...getCurrentParams(urlParams),
    setUrlParams: (params: TicketsParams) => setUrlParams(buildUrlQuery(params)),
  }
}
