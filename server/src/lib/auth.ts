import { betterAuth } from 'better-auth'

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

import { prismaAdapter } from 'better-auth/adapters/prisma'
import { createAuthMiddleware, APIError } from 'better-auth/api'
import { UserRole } from '@helpdesk/core'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: [process.env.TRUSTED_ORIGIN ?? 'http://localhost:5173'],
  user: {
    additionalFields: {
      role: {
        type: [UserRole.admin, UserRole.agent],
        required: true,
        defaultValue: UserRole.agent,
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return
      const email = ctx.body?.email as string | undefined
      if (!email) return
      const user = await prisma.user.findUnique({ where: { email } })
      if (user?.deletedAt) {
        throw new APIError('UNAUTHORIZED', { message: 'Invalid email or password' })
      }
    }),
  },
})
