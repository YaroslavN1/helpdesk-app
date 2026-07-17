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

export type Ticket = {
  id: number
  fromEmail: string
  fromName: string
  subject: string
  status: TicketStatus
  category: TicketCategory | null
  assignedTo: { name: string } | null
  createdAt: string
}

export type AgentOption = {
  id: string
  name: string
}

export type TicketDetails = Ticket & {
  body: string
  htmlBody: string | null
  assignedTo: AgentOption | null
  updatedAt: string
}

export type PaginatedTickets = {
  tickets: Ticket[]
  total: number
}
