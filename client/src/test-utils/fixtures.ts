import { TicketStatus, TicketCategory, type Ticket } from '@helpdesk/core'

export const openTechnicalTicket: Ticket = {
  id: 1,
  fromEmail: 'alice@example.com',
  fromName: 'Alice Smith',
  subject: 'Cannot log in to my account',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  assignedTo: { name: 'Bob Agent' },
  createdAt: '2024-03-15T10:00:00.000Z',
}

export const resolvedRefundTicket: Ticket = {
  id: 2,
  fromEmail: 'carol@example.com',
  fromName: 'Carol Jones',
  subject: 'I need a refund',
  status: TicketStatus.resolved,
  category: TicketCategory.refund_request,
  assignedTo: null,
  createdAt: '2024-04-01T08:30:00.000Z',
}

export const closedTicket: Ticket = {
  id: 3,
  fromEmail: 'dave@example.com',
  fromName: 'Dave Lee',
  subject: 'General enquiry',
  status: TicketStatus.closed,
  category: null,
  assignedTo: { name: 'Dave Agent' },
  createdAt: '2024-05-20T12:00:00.000Z',
}

export const openGeneralTicket: Ticket = {
  id: 4,
  fromEmail: 'eve@example.com',
  fromName: 'Eve Brown',
  subject: 'How does billing work?',
  status: TicketStatus.open,
  category: TicketCategory.general_question,
  assignedTo: null,
  createdAt: '2024-06-10T09:00:00.000Z',
}

export const TICKETS: Ticket[] = [
  openTechnicalTicket,
  resolvedRefundTicket,
  closedTicket,
  openGeneralTicket,
]
