import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/middleware'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
        subject: true,
        status: true,
        category: true,
        assignedTo: { select: { name: true } },
        createdAt: true,
      },
    })
    res.json(tickets)
  } catch (err) {
    console.error('[GET /api/tickets]', err)
    res.status(500).json({ error: 'Failed to load tickets' })
  }
})

export default router
