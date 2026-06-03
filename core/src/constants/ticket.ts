export const TicketStatus = {
  open: 'open',
  resolved: 'resolved',
  closed: 'closed',
} as const

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketCategory = {
  general_question: 'general_question',
  technical_question: 'technical_question',
  refund_request: 'refund_request',
} as const

export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory]

export const SORT_ORDERS = ['asc', 'desc'] as const
export type SortOrder = (typeof SORT_ORDERS)[number]
export const DEFAULT_SORT_ORDER: SortOrder = 'desc'

export const TICKET_SORT_COLUMNS = ['id', 'subject', 'fromName', 'status', 'category', 'createdAt'] as const
export type SortColumn = (typeof TICKET_SORT_COLUMNS)[number]
export const TICKET_DEFAULT_SORT_COLUMN: SortColumn = 'createdAt'

export type TicketsSort = {
  column: SortColumn
  order: SortOrder
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
