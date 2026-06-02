import { TicketStatus, TicketCategory } from '@helpdesk/core'
import { type Ticket } from '@/components/tickets/TicketsTable'

export const TICKETS: Ticket[] = [
  {
    id: 1,
    fromEmail: 'alice@example.com',
    fromName: 'Alice Smith',
    subject: 'Cannot log in to my account',
    status: TicketStatus.open,
    category: TicketCategory.technical_question,
    assignedTo: { name: 'Bob Agent' },
    createdAt: '2024-03-15T10:00:00.000Z',
  },
  {
    id: 2,
    fromEmail: 'carol@example.com',
    fromName: 'Carol Jones',
    subject: 'I need a refund',
    status: TicketStatus.resolved,
    category: TicketCategory.refund_request,
    assignedTo: null,
    createdAt: '2024-04-01T08:30:00.000Z',
  },
  {
    id: 3,
    fromEmail: 'dave@example.com',
    fromName: 'Dave Lee',
    subject: 'General enquiry',
    status: TicketStatus.closed,
    category: null,
    assignedTo: null,
    createdAt: '2024-05-20T12:00:00.000Z',
  },
]
