import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/middleware'
import { validate } from '../../lib/validate'
import {
  DEFAULT_PAGE_SIZE,
  SortOrder,
  SORT_ORDERS,
  TicketSortColumn,
  TICKET_SORT_COLUMNS,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  UserRole,
  updateTicketSchema,
  ticketDetailsSchema,
  paginatedTicketsSchema,
  type TicketStatus,
  type TicketCategory,
} from '@helpdesk/core'
import { ticketDetailSelect } from './ticket-id-param'
import type { Prisma } from '../../generated/prisma/client'

function toArray(val: unknown): unknown[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

const querySchema = z.object({
  sortBy: z.enum(TICKET_SORT_COLUMNS).default(TicketSortColumn.createdAt),
  sortOrder: z.enum(SORT_ORDERS).default(SortOrder.desc),
  search: z.string().optional(),
  status: z.preprocess(toArray, z.enum(TICKET_STATUSES).array().default([])),
  category: z.preprocess(toArray, z.enum(TICKET_CATEGORIES).array().default([])),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})

export function registerTicketRoutes(router: Router) {
  router.get('/', requireAuth, async (req, res) => {
    const query = validate(querySchema, req.query, res)
    if (!query) return
    const { sortBy, sortOrder, search, status, category, page, pageSize } = query
    const searchId = search ? parseInt(search, 10) : NaN

    const where: Prisma.TicketWhereInput = {
      ...(search && {
        OR: [
          ...(!isNaN(searchId) ? [{ id: { equals: searchId } }] : []),
          { subject: { contains: search, mode: 'insensitive' } },
          { fromName: { contains: search, mode: 'insensitive' } },
          { fromEmail: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status.length && { status: { in: status as TicketStatus[] } }),
      ...(category.length && { category: { in: category as TicketCategory[] } }),
    }

    const select = {
      id: true,
      fromEmail: true,
      fromName: true,
      subject: true,
      status: true,
      category: true,
      assignedTo: { select: { name: true } },
      createdAt: true,
    } as const

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select,
      }),
      prisma.ticket.count({ where }),
    ])
    res.json(paginatedTicketsSchema.parse({ tickets, total }))
  })

  router.get('/:id', requireAuth, async (_req, res) => {
    res.json(ticketDetailsSchema.parse(res.locals.ticket))
  })

  router.patch('/:id', requireAuth, async (req, res) => {
    const data = validate(updateTicketSchema, req.body, res)
    if (!data) return

    const { assignedToId, status, category } = data

    if (assignedToId) {
      const agent = await prisma.user.findUnique({
        where: { id: assignedToId, deletedAt: null },
      })
      if (!agent || agent.role !== UserRole.agent) {
        res.status(400).json({ error: 'Invalid agent' })
        return
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: res.locals.ticket.id },
      data: {
        ...(assignedToId !== undefined && { assignedToId }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
      },
      select: ticketDetailSelect,
    })

    res.json(ticketDetailsSchema.parse(updated))
  })
}
