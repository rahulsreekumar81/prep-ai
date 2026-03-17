import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { interviewRoutes } from './routes/interview'
import { evaluationRoutes } from './routes/evaluation'
import { userRoutes } from './routes/user'
import { errorHandler } from './middleware/error-handler'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [process.env.WEB_URL || 'http://localhost:3000'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)
app.onError(errorHandler)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }),
)

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/interviews', interviewRoutes)
app.route('/api/evaluations', evaluationRoutes)
app.route('/api/users', userRoutes)

const port = parseInt(process.env.PORT || '3001')

console.log(`PrepAI API running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })

export type AppType = typeof app
export default app
