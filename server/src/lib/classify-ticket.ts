import { prisma } from './prisma'
import { classifyTicketCategory } from './ai'

export async function classifyTicketInBackground(ticketId: number, subject: string, body: string) {
  try {
    const category = await classifyTicketCategory(subject, body)
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category },
    })
  } catch (error) {
    console.error(`Failed to classify ticket ${ticketId}:`, error)
  }
}
