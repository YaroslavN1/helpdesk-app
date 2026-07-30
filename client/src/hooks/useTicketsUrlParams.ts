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

function appendFilterParams(urlParams: URLSearchParams, filters: TicketsFilterCriteria) {
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

export function buildRequestQuery({ sort, filters, page }: TicketsParams): URLSearchParams {
  const query = new URLSearchParams()
  query.set('sortBy', sort.column)
  query.set('sortOrder', sort.order)
  query.set('page', String(page))
  query.set('pageSize', String(DEFAULT_PAGE_SIZE))
  appendFilterParams(query, filters)
  return query
}

export function useTicketsUrlParams() {
  const [urlParams, setUrlParams] = useSearchParams()

  return {
    ...getCurrentParams(urlParams),
    setUrlParams: (params: TicketsParams) => setUrlParams(buildUrlParams(params)),
  }
}
