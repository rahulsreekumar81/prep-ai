import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export const requireAuth = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  // TODO: Verify JWT token and attach user to context
  // const user = await verifyToken(token)
  // c.set('user', user)

  await next()
})
