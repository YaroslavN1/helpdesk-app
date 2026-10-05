import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/middleware'
import { replySelect } from '../../lib/reply'
import { SENDER_TYPE_LABELS, SenderType, ticketSummarySchema } from '@helpdesk/core'
import { summarizeTicketThread } from '../../lib/ai'

export const MAX_SUMMARIZE_REPLIES_INCLUDED = 25

const summarizeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.session.user.id,
  message: 'Too many summarize requests, please slow down',
  skip: () => process.env.NODE_ENV === 'test',
})

interface TicketForSummary {
  subject: string
  body: string
}

interface ReplyForSummary {
  senderType: SenderType
  body: string
}

function joinConversationHistory(ticket: TicketForSummary, replies: ReplyForSummary[]) {
  const ticketMessage = `Customer (original ticket "${ticket.subject}"):\n${ticket.body}`
  const replyMessages = replies.map(
    (reply) => `${SENDER_TYPE_LABELS[reply.senderType]}:\n${reply.body}`,
  )
  return [ticketMessage, ...replyMessages].join(`\n\n---\n\n`)
}

export function registerSummarizeRoutes(router: Router) {
  router.post('/:id/summarize', requireAuth, summarizeRateLimit, async (req, res) => {
    const recentReplies = await prisma.reply.findMany({
      where: { ticketId: res.locals.ticket.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_SUMMARIZE_REPLIES_INCLUDED,
      select: replySelect,
    })
    const ticketThread = joinConversationHistory(res.locals.ticket, recentReplies.reverse())
    const ticketThreadSummary = await summarizeTicketThread(ticketThread)
    res.json(ticketSummarySchema.parse({ body: ticketThreadSummary }))
  })
}
