import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/middleware'
import { validate } from '../../lib/validate'
import { SenderType, createReplySchema, replySchema } from '@helpdesk/core'

const replySelect = {
  id: true,
  body: true,
  htmlBody: true,
  senderType: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const

export function registerReplyRoutes(router: Router) {
  router.get('/:id/replies', requireAuth, async (_req, res) => {
    const replies = await prisma.reply.findMany({
      where: { ticketId: res.locals.ticket.id },
      orderBy: { createdAt: 'asc' },
      select: replySelect,
    })

    res.json(z.array(replySchema).parse(replies))
  })

  router.post('/:id/replies', requireAuth, async (req, res) => {
    const data = validate(createReplySchema, req.body, res)
    if (!data) return

    const createdReply = await prisma.reply.create({
      data: {
        body: data.body,
        senderType: SenderType.agent,
        ticketId: res.locals.ticket.id,
        userId: res.locals.session.user.id,
      },
      select: replySelect,
    })

    res.status(201).json(replySchema.parse(createdReply))
  })
}
