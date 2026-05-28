import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { UserRole } from '../generated/prisma/enums'
import { createUserSchema, editUserSchema } from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../lib/middleware'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

usersRouter.post('/', requireAuth, requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' })
    return
  }

  try {
    const hashedPassword = await hashPassword(password)
    const id = crypto.randomUUID()
    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        role: UserRole.agent,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: 'credential',
            password: hashedPassword,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

usersRouter.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const parsed = editUserSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }
  const { name, email, password } = parsed.data
  const id = req.params['id'] as string

  try {
    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const emailConflict = await prisma.user.findFirst({ where: { email, NOT: { id } } })
    if (emailConflict) {
      res.status(409).json({ error: 'A user with this email already exists' })
      return
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    if (password) {
      const hashedPassword = await hashPassword(password)
      await prisma.account.updateMany({
        where: { accountId: id, providerId: 'credential' },
        data: { password: hashedPassword },
      })
    }

    res.json(user)
  } catch (err) {
    console.error('[PATCH /api/users/:id]', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})
