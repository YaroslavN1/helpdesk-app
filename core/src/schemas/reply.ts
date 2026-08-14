import { z } from 'zod'
import { SENDER_TYPES } from '../constants/reply'

export const createReplySchema = z.object({
  body: z.string().trim().min(1, 'Reply body is required'),
})
export type CreateReplyInput = z.infer<typeof createReplySchema>

export const replySchema = z.object({
  id: z.number(),
  body: z.string(),
  htmlBody: z.string().nullable(),
  senderType: z.enum(SENDER_TYPES),
  createdAt: z.date().transform((date) => date.toISOString()),
  user: z.object({ id: z.string(), name: z.string() }).nullable(),
})
export type Reply = z.infer<typeof replySchema>
