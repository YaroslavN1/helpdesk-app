import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/middleware'
import { validate } from '../lib/validate'
import { TICKET_SORT_COLUMNS, SORT_ORDERS, TICKET_DEFAULT_SORT_COLUMN, DEFAULT_SORT_ORDER } from '@helpdesk/core'

const router = Router()

const querySchema = z.object({
  sortBy: z.enum(TICKET_SORT_COLUMNS).default(TICKET_DEFAULT_SORT_COLUMN),
  sortOrder: z.enum(SORT_ORDERS).default(DEFAULT_SORT_ORDER),
})

router.get('/', requireAuth, async (req, res) => {
  const query = validate(querySchema, req.query, res)
  if (!query) return
  const { sortBy, sortOrder } = query

  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { [sortBy]: sortOrder },
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
