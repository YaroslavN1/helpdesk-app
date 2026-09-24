import { z } from 'zod'
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  MAX_TICKET_FROM_NAME_LENGTH,
  MAX_TICKET_SUBJECT_LENGTH,
  MAX_TICKET_BODY_LENGTH,
  MAX_TICKET_HTML_BODY_LENGTH,
} from '../constants/ticket'
import { agentSchema } from './user'

export const inboundEmailSchema = z.object({
  from: z.email('Valid sender email is required'),
  fromName: z
    .string()
    .trim()
    .min(1, 'Sender name is required')
    .transform((value) => value.slice(0, MAX_TICKET_FROM_NAME_LENGTH)),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .transform((value) => value.slice(0, MAX_TICKET_SUBJECT_LENGTH)),
  body: z
    .string()
    .min(1, 'Plain text body is required')
    .transform((value) => value.slice(0, MAX_TICKET_BODY_LENGTH)),
  htmlBody: z
    .string()
    .optional()
    .transform((value) =>
      value === undefined ? value : value.slice(0, MAX_TICKET_HTML_BODY_LENGTH),
    ),
})

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>

export const updateTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).nullable().optional(),
})

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

export const ticketSchema = z.object({
  id: z.number(),
  fromEmail: z.string(),
  fromName: z.string(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  category: z.enum(TICKET_CATEGORIES).nullable(),
  assignedTo: z.object({ name: z.string() }).nullable(),
  createdAt: z.date().transform((date) => date.toISOString()),
})
export type Ticket = z.infer<typeof ticketSchema>

export const ticketDetailsSchema = ticketSchema.extend({
  body: z.string(),
  htmlBody: z.string().nullable(),
  assignedTo: agentSchema.nullable(),
  updatedAt: z.date().transform((date) => date.toISOString()),
})
export type TicketDetails = z.infer<typeof ticketDetailsSchema>

export const paginatedTicketsSchema = z.object({
  tickets: z.array(ticketSchema),
  total: z.number(),
})
export type PaginatedTickets = z.infer<typeof paginatedTicketsSchema>
