import { vi } from 'vitest'

export { getErrorMessage } from '../api-client'

export const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}
