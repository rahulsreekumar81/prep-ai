import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../lib/auth'
import type { AuthVariables } from '../types'

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyToken(token)
    c.set('userId', payload.userId)
    c.set('email', payload.email)
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }

  await next()
})
