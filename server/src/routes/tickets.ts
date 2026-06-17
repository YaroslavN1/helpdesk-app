import { Router, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/middleware'
import { validate } from '../lib/validate'
import { TICKET_SORT_COLUMNS, SORT_ORDERS, TICKET_STATUSES, TICKET_CATEGORIES, SortOrder, TicketSortColumn, DEFAULT_PAGE_SIZE, updateTicketSchema, UserRole, type TicketStatus, type TicketCategory } from '@helpdesk/core'
import type { Prisma } from '../generated/prisma/client'

const router = Router()

function toArray(val: unknown): unknown[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

function parseTicketId(raw: unknown, res: Response): number | null {
  const id = parseInt(raw as string, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' })
    return null
  }
  return id
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
  }

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
  res.json({ tickets, total })
})

const ticketDetailSelect = {
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

router.get('/:id', requireAuth, async (req, res) => {
  const id = parseTicketId(req.params.id, res)
  if (id === null) return

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: ticketDetailSelect })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  res.json(ticket)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const id = parseTicketId(req.params.id, res)
  if (id === null) return
  
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  const data = validate(updateTicketSchema, req.body, res)
  if (!data) return

  const { assignedToId, status, category } = data

  if (assignedToId) {
    const agent = await prisma.user.findUnique({ where: { id: assignedToId, deletedAt: null } })
    if (!agent || agent.role !== UserRole.agent) {
      res.status(400).json({ error: 'Invalid agent' })
      return
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    },
    select: ticketDetailSelect,
  })

  res.json(updated)
})

export default router
