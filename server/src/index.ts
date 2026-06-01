import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth'
import usersRouter from './routes/users'
import webhooksRouter from './routes/webhooks'
import ticketsRouter from './routes/tickets'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(helmet())
app.use(cors({ origin: process.env.TRUSTED_ORIGIN ?? 'http://localhost:5173', credentials: true }))

// Auth handler must be registered before express.json()
app.all('/api/auth/{*any}', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  skip: () => process.env.NODE_ENV === 'test',
}), toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/users', usersRouter)
app.use('/api/webhooks', webhooksRouter)
app.use('/api/tickets', ticketsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
