import { Hono } from 'hono'

export const userRoutes = new Hono()

// Get dashboard stats
userRoutes.get('/dashboard', async (c) => {
  // TODO: Aggregate from database
  return c.json({
    data: {
      totalInterviews: 0,
      averageScore: 0,
      streak: 0,
      weakAreas: [],
      recentInterviews: [],
    },
  })
})

// Get score progress over time
userRoutes.get('/progress', async (c) => {
  // TODO: Fetch score trend from database
  return c.json({ data: { progress: [] } })
})
