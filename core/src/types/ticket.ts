import type { TicketStatus, TicketCategory, SortOrder, TicketSortColumn } from '../constants/ticket'

export type TicketsSortCriteria = {
  column: TicketSortColumn
  order: SortOrder
}

export type TicketsFilterCriteria = {
  search: string
  status: TicketStatus[]
  category: TicketCategory[]
}
