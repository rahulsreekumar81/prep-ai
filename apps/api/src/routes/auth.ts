import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { users } from '@prepai/db/schema'
import { hashPassword, verifyPassword, createToken, verifyToken } from '../lib/auth'
import { generateId } from '../lib/id'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRoutes = new Hono()

// Signup
authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')
  const db = getDb()

  // Check if user exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing.length > 0) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const userId = generateId('usr')

  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
    plan: 'free',
  })

  const token = await createToken({ userId, email })

  return c.json(
    {
      data: {
        token,
        user: { id: userId, email, name, plan: 'free' },
      },
    },
    201,
  )
})

// Login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const db = getDb()

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (result.length === 0 || !result[0].passwordHash) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const user = result[0]
  const valid = await verifyPassword(password, user.passwordHash!)

  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = await createToken({ userId: user.id, email: user.email })

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        avatarUrl: user.avatarUrl,
      },
    },
  })
})

// Get current user
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Not authenticated' }, 401)
  }

  try {
    const payload = await verifyToken(authHeader.slice(7))
    const db = getDb()

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        plan: users.plan,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (result.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ data: { user: result[0] } })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
