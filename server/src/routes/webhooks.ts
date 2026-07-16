import { Router } from 'express'
import { inboundEmailSchema, TicketStatus } from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { requireWebhookSecret } from '../lib/middleware'
import { validate } from '../lib/validate'

function normalizeSubject(subject: string): string {
  return subject.replace(/^((re|fwd?)\s*:\s*)+/i, '').trim()
}

const router = Router()

router.post('/inbound-email', requireWebhookSecret, async (req, res) => {
  const data = validate(inboundEmailSchema, req.body, res)
  if (!data) return

  const { from, fromName, subject: rawSubject, body, htmlBody } = data
  const subject = normalizeSubject(rawSubject)

  const ticket = await prisma.ticket.create({
    data: {
      fromEmail: from,
      fromName,
      subject,
      body,
      htmlBody,
      status: TicketStatus.open,
    },
  })
  res.status(201).json(ticket)
})

export default router
