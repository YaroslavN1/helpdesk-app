import type { ZodTypeAny, z } from 'zod'
import type { Response } from 'express'

export function validate<T extends ZodTypeAny>(
  schema: T,
  body: unknown,
  res: Response,
): z.infer<T> | null {
  const result = schema.safeParse(body)
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message })
    return null
  }
  return result.data
}
