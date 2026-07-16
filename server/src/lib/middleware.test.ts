import { describe, test, expect, vi, afterEach } from 'vitest'
import { requireAuth, requireWebhookSecret } from './middleware'
import type { Request, Response, NextFunction } from 'express'
import { auth } from './auth'

type Session = Awaited<ReturnType<typeof auth.api.getSession>>

vi.mock('./auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

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
    locals: {} as Record<string, unknown>,
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

describe('requireAuth', () => {
  test('responds 401 without calling next() when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null)
    const request = createMockRequest()
    const response = createMockResponse()
    const next = createMockNext()

    await requireAuth(request, response, next)

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  test('attaches the session to res.locals and calls next() when a session exists', async () => {
    const session = { user: { id: 'user-1', role: 'agent' } } as unknown as NonNullable<Session>
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(session)
    const request = createMockRequest()
    const response = createMockResponse()
    const next = createMockNext()

    await requireAuth(request, response, next)

    expect(response.locals.session).toBe(session)
    expect(next).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBeUndefined()
  })
})

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
