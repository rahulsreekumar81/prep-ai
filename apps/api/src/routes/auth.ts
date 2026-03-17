import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { loginSchema, signupSchema } from '@prepai/shared/validators'

export const authRoutes = new Hono()

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const body = c.req.valid('json')
  // TODO: Create user, hash password, generate JWT
  return c.json({ data: { message: 'User created' } }, 201)
})

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const body = c.req.valid('json')
  // TODO: Verify credentials, generate JWT
  return c.json({ data: { token: 'jwt_token_here' } })
})

authRoutes.post('/google', async (c) => {
  // TODO: Google OAuth flow
  return c.json({ data: { token: 'jwt_token_here' } })
})

authRoutes.post('/logout', async (c) => {
  return c.json({ data: { message: 'Logged out' } })
})

authRoutes.get('/me', async (c) => {
  // TODO: Get current user from JWT
  return c.json({ data: { user: null } })
})
