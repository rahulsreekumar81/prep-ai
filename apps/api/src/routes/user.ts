import { Hono } from 'hono'
import { eq, desc, sql, and } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { interviews, evaluations, questions } from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import type { AuthVariables } from '../types'

export const userRoutes = new Hono<{ Variables: AuthVariables }>()

userRoutes.use('*', requireAuth)

// Dashboard stats
userRoutes.get('/dashboard', async (c) => {
  const userId = c.get('userId')
  const db = getDb()

  // Total interviews
  const interviewCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(interviews)
    .where(eq(interviews.userId, userId))

  // Recent interviews
  const recentInterviews = await db
    .select()
    .from(interviews)
    .where(eq(interviews.userId, userId))
    .orderBy(desc(interviews.createdAt))
    .limit(5)

  // Gather all evaluations for this user
  const allInterviewIds = await db
    .select({ id: interviews.id })
    .from(interviews)
    .where(eq(interviews.userId, userId))

  let totalScore = 0
  let totalEvaluations = 0
  const scoresByCategory: Record<string, number[]> = {
    relevance: [],
    depth: [],
    clarity: [],
    structure: [],
  }

  for (const interview of allInterviewIds) {
    const qs = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.interviewId, interview.id))

    for (const q of qs) {
      const evals = await db.select().from(evaluations).where(eq(evaluations.questionId, q.id))

      for (const e of evals) {
        totalEvaluations++
        totalScore += e.overallScore
        scoresByCategory.relevance.push(e.relevanceScore)
        scoresByCategory.depth.push(e.depthScore)
        scoresByCategory.clarity.push(e.clarityScore)
        scoresByCategory.structure.push(e.structureScore)
      }
    }
  }

  const averageScore = totalEvaluations > 0 ? totalScore / totalEvaluations : 0

  // Find weak areas (average < 6)
  const weakAreas: string[] = []
  for (const [area, scores] of Object.entries(scoresByCategory)) {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < 6) weakAreas.push(area)
    }
  }

  return c.json({
    data: {
      totalInterviews: interviewCount[0].count,
      averageScore: Math.round(averageScore * 10) / 10,
      totalEvaluations,
      weakAreas,
      recentInterviews,
    },
  })
})

// Score progress over time
userRoutes.get('/progress', async (c) => {
  const userId = c.get('userId')
  const db = getDb()

  const userInterviews = await db
    .select()
    .from(interviews)
    .where(eq(interviews.userId, userId))
    .orderBy(interviews.createdAt)

  const progress = []

  for (const interview of userInterviews) {
    const qs = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.interviewId, interview.id))

    let total = 0
    let count = 0

    for (const q of qs) {
      const evals = await db
        .select({ overallScore: evaluations.overallScore })
        .from(evaluations)
        .where(eq(evaluations.questionId, q.id))

      for (const e of evals) {
        total += e.overallScore
        count++
      }
    }

    if (count > 0) {
      progress.push({
        interviewId: interview.id,
        date: interview.createdAt,
        companyName: interview.companyName,
        averageScore: Math.round((total / count) * 10) / 10,
      })
    }
  }

  return c.json({ data: { progress } })
})
