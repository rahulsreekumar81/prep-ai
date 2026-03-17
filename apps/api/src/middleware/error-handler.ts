import type { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack)

  const status = 'status' in err ? (err.status as number) : 500
  const message = status === 500 ? 'Internal server error' : err.message

  return c.json({ error: message }, status)
}
