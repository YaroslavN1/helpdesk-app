import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../src/lib/prisma'

const email = process.env.SEED_AGENT_EMAIL
const password = process.env.SEED_AGENT_PASSWORD
const name = process.env.SEED_AGENT_NAME ?? 'Test Agent'

if (!email || !password) {
  console.error('SEED_AGENT_EMAIL and SEED_AGENT_PASSWORD must be set')
  process.exit(1)
}

const existing = await prisma.user.findUnique({ where: { email } })
if (existing) {
  console.log(`[seed-agent] Agent user already exists: ${email}`)
  await prisma.$disconnect()
  process.exit(0)
}

const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
})

await seedAuth.api.signUpEmail({
  body: { email, password, name },
})

console.log(`[seed-agent] Agent user created: ${email}`)
await prisma.$disconnect()
