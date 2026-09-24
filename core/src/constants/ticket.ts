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
export const TICKET_CATEGORIES = Object.values(TicketCategory) as [
  TicketCategory,
  ...TicketCategory[],
]
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
export const TICKET_SORT_COLUMNS = Object.values(TicketSortColumn) as [
  TicketSortColumn,
  ...TicketSortColumn[],
]

export const DEFAULT_PAGE_SIZE = 10

export const MAX_TICKET_FROM_NAME_LENGTH = 255
export const MAX_TICKET_SUBJECT_LENGTH = 255
export const MAX_TICKET_BODY_LENGTH = 2000
export const MAX_TICKET_HTML_BODY_LENGTH = 4000
