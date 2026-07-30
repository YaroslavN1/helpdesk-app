import { describe, it, expect } from 'vitest'
import { apiClient, getErrorMessage } from './api-client'

describe('apiClient', () => {
  it('is configured with credentials and the API base URL', () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
    expect(apiClient.defaults.baseURL).toBe('/api')
  })
})

describe('getErrorMessage', () => {
  const FALLBACK_ERROR_MESSAGE = 'Failed to load ticket'

  it('returns null for a falsy error', () => {
    expect(getErrorMessage(null, 'Something went wrong')).toBeNull()
    expect(getErrorMessage(undefined, 'Something went wrong')).toBeNull()
  })

  it('returns the server-provided message for an Axios error with response data', () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 404, data: { error: 'Ticket not found' } },
    }

    expect(getErrorMessage(axiosError, FALLBACK_ERROR_MESSAGE)).toBe('Ticket not found')
  })

  it('returns the fallback for an Axios error with no response (network-style failure)', () => {
    const axiosError = { isAxiosError: true, response: undefined }

    expect(getErrorMessage(axiosError, FALLBACK_ERROR_MESSAGE)).toBe(FALLBACK_ERROR_MESSAGE)
  })

  it('returns the fallback for an Axios error whose response has no error field', () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    }

    expect(getErrorMessage(axiosError, FALLBACK_ERROR_MESSAGE)).toBe(FALLBACK_ERROR_MESSAGE)
  })

  it('returns the fallback for a non-Axios error, ignoring its own message', () => {
    const plainError = new Error('boom')

    expect(getErrorMessage(plainError, FALLBACK_ERROR_MESSAGE)).toBe(FALLBACK_ERROR_MESSAGE)
  })
})
