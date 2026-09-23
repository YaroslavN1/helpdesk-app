import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../../lib/middleware'
import { validate } from '../../lib/validate'
import { polishReplySchema, polishedReplySchema } from '@helpdesk/core'
import { polishReplyText } from '../../lib/ai'
import { prisma } from '../../lib/prisma'

const polishRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.session.user.id,
  message: 'Too many polish requests, please slow down',
  skip: () => process.env.NODE_ENV === 'test',
})

export function registerPolishRoutes(router: Router) {
  router.post('/:id/polish-reply', requireAuth, polishRateLimit, async (req, res) => {
    const data = validate(polishReplySchema, req.body, res)
    if (!data) return

    const lastCustomerReply = await prisma.reply.findFirst({
      where: { ticketId: res.locals.ticket.id, senderType: 'customer' },
      orderBy: { createdAt: 'desc' },
    })

    const ticket = res.locals.ticket

    const polishedReply = await polishReplyText(data.body, {
      contextSubject: ticket.subject,
      contextBody: lastCustomerReply?.body || ticket.body,
    })

    res.json(polishedReplySchema.parse({ body: polishedReply }))
  })
}
