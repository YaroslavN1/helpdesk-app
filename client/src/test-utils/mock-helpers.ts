import { vi } from 'vitest'

export function mockResolved(fn: (...args: never[]) => unknown, value: unknown) {
  vi.mocked(fn).mockResolvedValue(value)
}

export function mockRejected(fn: (...args: never[]) => unknown, error: unknown) {
  vi.mocked(fn).mockRejectedValue(error)
}

export function mockReturn(fn: (...args: never[]) => unknown, value: unknown) {
  vi.mocked(fn).mockReturnValue(value)
}
