import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth'
import type { Request, Response, NextFunction } from 'express'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.locals.session = session
  next()
}

export async function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  const session = res.locals.session
  if (session?.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.WEBHOOK_SECRET
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    res.status(401).json({ error: 'Invalid webhook secret' })
    return
  }
  next()
}
