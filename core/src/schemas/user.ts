import { z } from 'zod'
import { UserRole } from '../constants/role'
import { MAX_USER_PASSWORD_LENGTH } from '../constants/user'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(UserRole),
  createdAt: z.date().transform((date) => date.toISOString()),
})
export type User = z.infer<typeof userSchema>

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(
      MAX_USER_PASSWORD_LENGTH,
      `Password must be ${MAX_USER_PASSWORD_LENGTH} characters or fewer`,
    ),
})
export type CreateUser = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(
      MAX_USER_PASSWORD_LENGTH,
      `Password must be ${MAX_USER_PASSWORD_LENGTH} characters or fewer`,
    )
    .optional(),
})
export type UpdateUser = z.infer<typeof updateUserSchema>

export const agentSchema = z.object({ id: z.string(), name: z.string() })
export type Agent = z.infer<typeof agentSchema>
