import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth'
import { prisma } from './lib/prisma'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(helmet())
app.use(cors({ origin: process.env.TRUSTED_ORIGIN ?? 'http://localhost:5173', credentials: true }))

// Auth handler must be registered before express.json()
app.all('/api/auth/*splat', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
}), toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({ status: 'ok', db: 'connected' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
