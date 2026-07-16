import { test, expect } from '@playwright/test'

const SERVER_BASE_URL = process.env.BETTER_AUTH_URL!
const ENDPOINT = `${SERVER_BASE_URL}/api/webhooks/inbound-email`
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!

const secretHeaders = { 'X-Webhook-Secret': WEBHOOK_SECRET }

const validPayload = {
  from: 'customer@example.com',
  fromName: 'Test Customer',
  subject: 'Login broken',
  body: 'I cannot log in to my account.',
  htmlBody: '<p>I cannot log in to my account.</p>',
}

test.describe('POST /api/webhooks/inbound-email', () => {
  test.describe('Happy path', () => {
    test('returns 201 with the created ticket when payload and secret are valid', async ({
      request,
    }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: validPayload,
      })

      expect(response.status()).toBe(201)
    })

    test('response body contains all expected ticket fields', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: validPayload,
      })

      const ticket = await response.json()

      expect(typeof ticket.id).toBe('number')
      expect(ticket.fromEmail).toBe(validPayload.from)
      expect(ticket.fromName).toBe(validPayload.fromName)
      expect(ticket.body).toBe(validPayload.body)
      expect(ticket.htmlBody).toBe(validPayload.htmlBody)
      expect(ticket.status).toBe('open')
      expect(ticket.category).toBeNull()
      expect(ticket.assignedToId).toBeNull()
      expect(typeof ticket.createdAt).toBe('string')
      expect(typeof ticket.updatedAt).toBe('string')
    })

    test('ticket id is a positive integer', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: validPayload,
      })

      const ticket = await response.json()
      expect(ticket.id).toBeGreaterThan(0)
    })

    test('omitting optional htmlBody still returns 201 with htmlBody null', async ({ request }) => {
      const { htmlBody: _omitted, ...payloadWithoutHtml } = validPayload

      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: payloadWithoutHtml,
      })

      expect(response.status()).toBe(201)
      const ticket = await response.json()
      expect(ticket.htmlBody).toBeNull()
    })

    test('two sequential requests create two distinct tickets with different ids', async ({
      request,
    }) => {
      const [r1, r2] = await Promise.all([
        request.post(ENDPOINT, { headers: secretHeaders, data: validPayload }),
        request.post(ENDPOINT, { headers: secretHeaders, data: validPayload }),
      ])

      expect(r1.status()).toBe(201)
      expect(r2.status()).toBe(201)

      const t1 = await r1.json()
      const t2 = await r2.json()

      expect(t1.id).not.toBe(t2.id)
    })
  })

  test.describe('Subject normalisation', () => {
    test('strips leading "Re: Fwd: " prefixes and stores the bare subject', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: { ...validPayload, subject: 'Re: Fwd: Login broken' },
      })

      expect(response.status()).toBe(201)
      const ticket = await response.json()
      expect(ticket.subject).toBe('Login broken')
    })
  })

  test.describe('Webhook secret', () => {
    test('returns 401 with error body when X-Webhook-Secret header is missing', async ({
      request,
    }) => {
      const response = await request.post(ENDPOINT, { data: validPayload })

      expect(response.status()).toBe(401)
      expect(await response.json()).toHaveProperty('error', 'Invalid webhook secret')
    })

    test('returns 401 with error body when X-Webhook-Secret header value is wrong', async ({
      request,
    }) => {
      const response = await request.post(ENDPOINT, {
        headers: { 'X-Webhook-Secret': 'totally-wrong-secret' },
        data: validPayload,
      })

      expect(response.status()).toBe(401)
      expect(await response.json()).toHaveProperty('error', 'Invalid webhook secret')
    })
  })

  test.describe('Payload validation', () => {
    test('returns 400 when required field "from" is missing', async ({ request }) => {
      const { from: _omitted, ...payloadWithoutFrom } = validPayload

      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: payloadWithoutFrom,
      })

      expect(response.status()).toBe(400)
    })

    test('returns 400 with error message when "from" is not a valid email', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: { ...validPayload, from: 'not-an-email' },
      })

      expect(response.status()).toBe(400)
      expect(await response.json()).toHaveProperty('error')
    })

    test('returns 400 when required field "fromName" is missing', async ({ request }) => {
      const { fromName: _omitted, ...payloadWithoutName } = validPayload

      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: payloadWithoutName,
      })

      expect(response.status()).toBe(400)
    })

    test('returns 400 when required field "subject" is missing', async ({ request }) => {
      const { subject: _omitted, ...payloadWithoutSubject } = validPayload

      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: payloadWithoutSubject,
      })

      expect(response.status()).toBe(400)
    })

    test('returns 400 when "subject" field is an empty string', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: { ...validPayload, subject: '' },
      })

      expect(response.status()).toBe(400)
    })

    test('returns 400 with error message when required field "body" (email body) is missing', async ({
      request,
    }) => {
      const { body: _omitted, ...payloadWithoutDescription } = validPayload

      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: payloadWithoutDescription,
      })

      expect(response.status()).toBe(400)
      expect(await response.json()).toHaveProperty('error')
    })

    test('returns 400 when "body" field (email body) is an empty string', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: { ...validPayload, body: '' },
      })

      expect(response.status()).toBe(400)
    })

    test('returns 400 when the request payload is completely empty', async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        headers: secretHeaders,
        data: {},
      })

      expect(response.status()).toBe(400)
    })

    test('secret check runs before payload validation — missing secret on invalid payload still returns 401', async ({
      request,
    }) => {
      const response = await request.post(ENDPOINT, {
        // no secret header AND invalid payload
        data: { from: 'not-an-email', body: '' },
      })

      expect(response.status()).toBe(401)
    })
  })
})
