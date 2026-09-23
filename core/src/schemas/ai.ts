import { z } from 'zod'
import { createReplySchema } from './reply'

export const polishReplySchema = createReplySchema
export type PolishReply = z.infer<typeof polishReplySchema>

export const polishedReplySchema = z.object({
  body: z.string(),
})
export type PolishedReply = z.infer<typeof polishedReplySchema>
