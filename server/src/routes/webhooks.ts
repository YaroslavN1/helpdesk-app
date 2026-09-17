import { Router } from 'express'
import {
  inboundEmailSchema,
  replySchema,
  ticketSchema,
  SenderType,
  TicketStatus,
} from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { requireWebhookSecret } from '../lib/middleware'
import { validate } from '../lib/validate'
import { createReply } from '../lib/reply'
import { sanitizeHtml } from '../lib/sanitize-html'

function normalizeSubject(subject: string): string {
  return subject.replace(/^((re|fwd?)\s*:\s*)+/i, '').trim()
}

const router = Router()

router.post('/inbound-email', requireWebhookSecret, async (req, res) => {
  const data = validate(inboundEmailSchema, req.body, res)
  if (!data) return

  const { from, fromName, subject: rawSubject, body, htmlBody } = data
  const subject = normalizeSubject(rawSubject)
  const sanitizedHtmlBody = htmlBody ? sanitizeHtml(htmlBody) : htmlBody

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      fromEmail: from,
      status: TicketStatus.open,
      subject: { equals: subject, mode: 'insensitive' },
    },
  })

  if (existingTicket) {
    const createdReply = await createReply({
      ticketId: existingTicket.id,
      body,
      htmlBody: sanitizedHtmlBody,
      senderType: SenderType.customer,
      userId: null,
    })
    res.status(201).json(replySchema.parse(createdReply))
    return
  }

  const createdTicket = await prisma.ticket.create({
    data: {
      fromEmail: from,
      fromName,
      subject,
      body,
      htmlBody: sanitizedHtmlBody,
      status: TicketStatus.open,
    },
    include: { assignedTo: { select: { name: true } } },
  })
  res.status(201).json(ticketSchema.parse(createdTicket))
})

export default router
