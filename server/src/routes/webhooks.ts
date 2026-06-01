import { Router } from 'express'
import { inboundEmailSchema, TicketStatus } from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { requireWebhookSecret } from '../lib/middleware'

function normalizeSubject(subject: string): string {
  return subject.replace(/^((re|fwd?)\s*:\s*)+/i, '').trim()
}

export const webhooksRouter = Router()

webhooksRouter.post('/inbound-email', requireWebhookSecret, async (req, res) => {
  const parsed = inboundEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { from, fromName, subject: rawSubject, body, htmlBody } = parsed.data
  const subject = normalizeSubject(rawSubject)

  try {
    const ticket = await prisma.ticket.create({
      data: { fromEmail: from, fromName, subject, body, htmlBody, status: TicketStatus.open },
    })
    res.status(201).json(ticket)
  } catch (err) {
    console.error('[POST /api/webhooks/inbound-email]', err)
    res.status(500).json({ error: 'Failed to create ticket' })
  }
})
