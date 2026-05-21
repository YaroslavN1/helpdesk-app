import { betterAuth } from 'better-auth'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: [process.env.TRUSTED_ORIGIN ?? 'http://localhost:5173'],
  user: {
    additionalFields: {
      role: {
        type: ['admin', 'agent'] as const,
        required: true,
        defaultValue: 'agent',
        input: false,
      },
    },
  },
})
