import { describe, test, expect, vi, afterEach } from 'vitest'
import { requireWebhookSecret } from './middleware'
import type { Request, Response, NextFunction } from 'express'

const originalWebhookSecret = process.env.WEBHOOK_SECRET

function restoreWebhookSecret() {
  if (originalWebhookSecret === undefined) {
    delete process.env.WEBHOOK_SECRET
  } else {
    process.env.WEBHOOK_SECRET = originalWebhookSecret
  }
}

function createMockRequest(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request
}

function createMockNext() {
  return vi.fn() as unknown as NextFunction
}

function createMockResponse() {
  const response = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status(code: number) {
      response.statusCode = code
      return response
    },
    json(payload: unknown) {
      response.body = payload
      return response
    },
  }
  return response as unknown as Response & { statusCode?: number; body?: unknown }
}

describe('requireWebhookSecret', () => {
  afterEach(() => {
    restoreWebhookSecret()
  })

  test('rejects with 401 when WEBHOOK_SECRET is not configured, even if a header is sent', () => {
    delete process.env.WEBHOOK_SECRET
    const request = createMockRequest({ 'x-webhook-secret': 'anything' })
    const response = createMockResponse()
    const next = createMockNext()

    requireWebhookSecret(request, response, next)

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid webhook secret' })
    expect(next).not.toHaveBeenCalled()
  })

  test('rejects with 401 when the header value is wrong', () => {
    process.env.WEBHOOK_SECRET = 'correct-secret'
    const request = createMockRequest({ 'x-webhook-secret': 'wrong-secret' })
    const response = createMockResponse()
    const next = createMockNext()

    requireWebhookSecret(request, response, next)

    expect(response.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  test('calls next() when the header matches the configured secret', () => {
    process.env.WEBHOOK_SECRET = 'correct-secret'
    const request = createMockRequest({ 'x-webhook-secret': 'correct-secret' })
    const response = createMockResponse()
    const next = createMockNext()

    requireWebhookSecret(request, response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBeUndefined()
  })
})
