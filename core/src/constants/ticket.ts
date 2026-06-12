export const TicketStatus = {
  open: 'open',
  resolved: 'resolved',
  closed: 'closed',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]
export const TICKET_STATUSES = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const TicketCategory = {
  general_question: 'general_question',
  technical_question: 'technical_question',
  refund_request: 'refund_request',
} as const
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory]
export const TICKET_CATEGORIES = Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  general_question: 'General',
  technical_question: 'Technical',
  refund_request: 'Refund',
}

export const SortOrder = { asc: 'asc', desc: 'desc' } as const
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]
export const SORT_ORDERS = Object.values(SortOrder) as [SortOrder, ...SortOrder[]]

export const TicketSortColumn = {
  id: 'id',
  subject: 'subject',
  fromName: 'fromName',
  status: 'status',
  category: 'category',
  createdAt: 'createdAt',
} as const
export type TicketSortColumn = (typeof TicketSortColumn)[keyof typeof TicketSortColumn]
export const TICKET_SORT_COLUMNS = Object.values(TicketSortColumn) as [TicketSortColumn, ...TicketSortColumn[]]

export type TicketsSort = {
  column: TicketSortColumn
  order: SortOrder
}

export type TicketsFilters = {
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

export const DEFAULT_PAGE_SIZE = 10

export type PaginatedTickets = {
  tickets: Ticket[]
  total: number
}
