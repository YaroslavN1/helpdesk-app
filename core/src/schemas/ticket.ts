import { z } from 'zod'
import { TICKET_STATUSES, TICKET_CATEGORIES } from '../constants/ticket'

export const inboundEmailSchema = z.object({
  from: z.email('Valid sender email is required'),
  fromName: z.string().trim().min(1, 'Sender name is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  body: z.string().min(1, 'Plain text body is required'),
  htmlBody: z.string().optional(),
})

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>

export const updateTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).nullable().optional(),
})

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
