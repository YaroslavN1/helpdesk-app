export const TicketStatus = {
  open: 'open',
  resolved: 'resolved',
  closed: 'closed',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]
export const TICKET_STATUSES = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]

export const TicketCategory = {
  general_question: 'general_question',
  technical_question: 'technical_question',
  refund_request: 'refund_request',
} as const
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory]
export const TICKET_CATEGORIES = Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]]
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  general_question: 'General question',
  technical_question: 'Technical question',
  refund_request: 'Refund request',
}

export type TicketsFilters = {
  search?: string
  status?: TicketStatus[]
  category?: TicketCategory[]
}

export const SortOrder = { asc: 'asc', desc: 'desc' } as const
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]
export const SORT_ORDERS = Object.values(SortOrder) as [SortOrder, ...SortOrder[]]

export const SortColumn = {
  id: 'id',
  subject: 'subject',
  fromName: 'fromName',
  status: 'status',
  category: 'category',
  createdAt: 'createdAt',
} as const
export type SortColumn = (typeof SortColumn)[keyof typeof SortColumn]
export const TICKET_SORT_COLUMNS = Object.values(SortColumn) as [SortColumn, ...SortColumn[]]

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
