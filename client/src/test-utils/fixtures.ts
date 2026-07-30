import { TicketStatus, TicketCategory, type Ticket } from '@helpdesk/core'
import { type User } from '@/types/user'

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

export const USERS: User[] = [
  {
    id: '1',
    name: 'Admin Test User',
    email: 'admin_test@example.com',
    role: 'admin',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Agent Test User',
    email: 'agent_test@example.com',
    role: 'agent',
    createdAt: '2024-03-22T00:00:00.000Z',
  },
]

export const NEW_USER: User = {
  id: '3',
  name: 'New Person',
  email: 'new@example.com',
  role: 'agent',
  createdAt: '2024-06-01T00:00:00.000Z',
}
