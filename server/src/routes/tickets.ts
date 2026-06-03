import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/middleware'
import { validate } from '../lib/validate'
import { TICKET_SORT_COLUMNS, SORT_ORDERS, TICKET_STATUSES, TICKET_CATEGORIES, SortOrder, SortColumn, type TicketStatus, type TicketCategory } from '@helpdesk/core'
import type { Prisma } from '../generated/prisma/client'

const router = Router()

function toArray(val: unknown): unknown[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

const querySchema = z.object({
  sortBy: z.enum(TICKET_SORT_COLUMNS).default(SortColumn.createdAt),
  sortOrder: z.enum(SORT_ORDERS).default(SortOrder.desc),
  search: z.string().optional(),
  status: z.preprocess(toArray, z.enum(TICKET_STATUSES).array().default([])),
  category: z.preprocess(toArray, z.enum(TICKET_CATEGORIES).array().default([])),
})

router.get('/', requireAuth, async (req, res) => {
  const query = validate(querySchema, req.query, res)
  if (!query) return
  const { sortBy, sortOrder, search, status, category } = query

  const where: Prisma.TicketWhereInput = {
    ...(search && {
      OR: [
        { subject: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
        { fromEmail: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(status.length && { status: { in: status as TicketStatus[] } }),
    ...(category.length && { category: { in: category as TicketCategory[] } }),
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where,
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
