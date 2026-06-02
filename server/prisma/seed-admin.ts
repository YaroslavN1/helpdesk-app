import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../src/lib/prisma'
import { UserRole } from '../src/generated/prisma/enums'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set')
  process.exit(1)
}

// Separate auth instance with sign-up enabled for seeding
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
})

const existing = await prisma.user.findUnique({ where: { email } })
if (existing) {
  console.log(`Admin user already exists: ${email}`)
  process.exit(0)
}

const result = await seedAuth.api.signUpEmail({
  body: { email, password, name: 'Admin' },
})

await prisma.user.update({
  where: { email },
  data: { role: UserRole.admin },
})

console.log(`Admin user created: ${result.user.email}`)
