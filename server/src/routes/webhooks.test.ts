import { describe, test, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SenderType, TicketStatus } from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { createReply } from '../lib/reply'
import webhooksRouter from './webhooks'

vi.mock('../lib/prisma', () => ({
  prisma: {
    ticket: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('../lib/reply', () => ({
  createReply: vi.fn(),
}))

vi.mock('../lib/middleware', () => ({
  requireWebhookSecret: vi.fn((_request, _response, next) => next()),
}))

const app = express()
app.use(express.json())
app.use('/', webhooksRouter)

const maliciousHtmlBody = '<p>Hello</p><script>alert(1)</script>'

const validPayload = {
  from: 'customer@example.com',
  fromName: 'Jane Customer',
  subject: 'Help needed',
  body: 'Plain text body',
  htmlBody: maliciousHtmlBody,
}

describe('POST /inbound-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sanitizes htmlBody and creates a new ticket when no matching open ticket exists', async () => {
    vi.mocked(prisma.ticket.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.ticket.create).mockResolvedValueOnce({
      id: 1,
      fromEmail: validPayload.from,
      fromName: validPayload.fromName,
      subject: validPayload.subject,
      status: TicketStatus.open,
      category: null,
      assignedTo: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never)

    const response = await request(app).post('/inbound-email').send(validPayload)

    expect(prisma.ticket.create).toHaveBeenCalledTimes(1)
    const createCallArguments = vi.mocked(prisma.ticket.create).mock.calls[0][0] as {
      data: { htmlBody?: string | null }
    }
    expect(createCallArguments.data.htmlBody).not.toContain('<script')
    expect(createCallArguments.data.htmlBody).not.toContain('alert(1)')
    expect(createCallArguments.data.htmlBody).toContain('<p>Hello</p>')
    expect(createReply).not.toHaveBeenCalled()
    expect(response.status).toBe(201)
  })

  test('sanitizes htmlBody and creates a reply when a matching open ticket exists', async () => {
    const existingTicket = { id: 42 }
    vi.mocked(prisma.ticket.findFirst).mockResolvedValueOnce(existingTicket as never)
    vi.mocked(createReply).mockResolvedValueOnce({
      id: 7,
      body: validPayload.body,
      htmlBody: '<p>Hello</p>',
      senderType: SenderType.customer,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user: null,
    } as never)

    const response = await request(app).post('/inbound-email').send(validPayload)

    expect(createReply).toHaveBeenCalledTimes(1)
    const createReplyArguments = vi.mocked(createReply).mock.calls[0][0]
    expect(createReplyArguments.htmlBody).not.toContain('<script')
    expect(createReplyArguments.htmlBody).not.toContain('alert(1)')
    expect(createReplyArguments.htmlBody).toContain('<p>Hello</p>')
    expect(createReplyArguments.ticketId).toBe(existingTicket.id)
    expect(createReplyArguments.senderType).toBe(SenderType.customer)
    expect(createReplyArguments.userId).toBeNull()
    expect(prisma.ticket.create).not.toHaveBeenCalled()
    expect(response.status).toBe(201)
  })

  test('responds 400 and never touches prisma/createReply when the payload is invalid', async () => {
    const response = await request(app)
      .post('/inbound-email')
      .send({ ...validPayload, from: undefined })

    expect(response.status).toBe(400)
    expect(prisma.ticket.findFirst).not.toHaveBeenCalled()
    expect(prisma.ticket.create).not.toHaveBeenCalled()
    expect(createReply).not.toHaveBeenCalled()
  })
})
