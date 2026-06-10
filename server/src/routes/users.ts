import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { createUserSchema, editUserSchema, UserRole } from '@helpdesk/core'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../lib/middleware'
import { validate } from '../lib/validate'

const router = Router()

router.get('/agents', requireAuth, async (_req, res) => {
  const agents = await prisma.user.findMany({
    where: { deletedAt: null, role: UserRole.agent },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  res.json(agents)
})

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json(users)
})

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const data = validate(createUserSchema, req.body, res)
  if (!data) return
  const { name, email, password } = data

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

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const data = validate(editUserSchema, req.body, res)
  if (!data) return
  const { name, email, password } = data
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

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = req.params['id'] as string

  try {
    const target = await prisma.user.findUnique({ where: { id, deletedAt: null } })
    if (!target) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (target.role === UserRole.admin) {
      res.status(403).json({ error: 'Admin users cannot be deleted' })
      return
    }

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
    await prisma.session.deleteMany({ where: { userId: id } })
    res.status(204).send()
  } catch (err) {
    console.error('[DELETE /api/users/:id]', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
