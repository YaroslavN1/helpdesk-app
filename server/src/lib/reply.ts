import { prisma } from '../lib/prisma'
import { SenderType } from '@helpdesk/core'

export const replySelect = {
  id: true,
  body: true,
  htmlBody: true,
  senderType: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const

interface CreateReplyParams {
  ticketId: number
  body: string
  htmlBody?: string | null
  senderType: SenderType
  userId?: string | null
}

export async function createReply({
  ticketId,
  body,
  htmlBody,
  senderType,
  userId,
}: CreateReplyParams) {
  const [createdReply] = await prisma.$transaction([
    prisma.reply.create({
      data: {
        body,
        htmlBody,
        senderType,
        ticketId,
        userId,
      },
      select: replySelect,
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    }),
  ])

  return createdReply
}
