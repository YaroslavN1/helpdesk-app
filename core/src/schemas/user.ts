import { z } from 'zod'
import { UserRole } from '../constants/role'

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
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const editUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

export type EditUserInput = z.infer<typeof editUserSchema>

export const agentSchema = z.object({ id: z.string(), name: z.string() })
export type Agent = z.infer<typeof agentSchema>
