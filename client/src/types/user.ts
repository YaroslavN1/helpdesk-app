import { type UserRole } from '@helpdesk/core'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}
