import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

export const ticketDetailSelect = {
  id: true,
  fromEmail: true,
  fromName: true,
  subject: true,
  body: true,
  htmlBody: true,
  status: true,
  category: true,
  assignedTo: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} as const

export async function ticketIdParam(
  req: Request,
  res: Response,
  next: NextFunction,
  rawId: string,
) {
  const id = parseInt(rawId, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' })
    return
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: ticketDetailSelect,
  })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  res.locals.ticket = ticket
  next()
}
