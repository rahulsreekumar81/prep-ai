import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

const requestCounts = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (maxRequests: number = 100, windowMs: number = 60_000) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()

    const entry = requestCounts.get(ip)

    if (!entry || now > entry.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs })
    } else {
      entry.count++
      if (entry.count > maxRequests) {
        throw new HTTPException(429, { message: 'Too many requests' })
      }
    }

    await next()
  })
