import { Hono } from 'hono'
import { eq, desc, sql, inArray } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { interviews, evaluations, questions } from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import type { AuthVariables } from '../types'

export const userRoutes = new Hono<{ Variables: AuthVariables }>()

userRoutes.use('*', requireAuth)

// Dashboard stats — single pass with JOINs instead of N+1 loops
userRoutes.get('/dashboard', async (c) => {
  const userId = c.get('userId')
  const db = getDb()

  // Run all queries in parallel
  const [interviewRows, recentInterviews, evalAggRows] = await Promise.all([
    // Total count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(interviews)
      .where(eq(interviews.userId, userId)),

    // 5 most recent interviews
    db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.createdAt))
      .limit(5),

    // All evaluations for this user via a single JOIN
    db
      .select({
        overallScore: evaluations.overallScore,
        relevanceScore: evaluations.relevanceScore,
        depthScore: evaluations.depthScore,
        clarityScore: evaluations.clarityScore,
        structureScore: evaluations.structureScore,
      })
      .from(evaluations)
      .innerJoin(questions, eq(evaluations.questionId, questions.id))
      .innerJoin(interviews, eq(questions.interviewId, interviews.id))
      .where(eq(interviews.userId, userId)),
  ])

  const totalEvaluations = evalAggRows.length
  const totalScore = evalAggRows.reduce((sum, e) => sum + e.overallScore, 0)
  const averageScore = totalEvaluations > 0 ? totalScore / totalEvaluations : 0

  const scoresByCategory = {
    relevance: evalAggRows.map((e) => e.relevanceScore),
    depth: evalAggRows.map((e) => e.depthScore),
    clarity: evalAggRows.map((e) => e.clarityScore),
    structure: evalAggRows.map((e) => e.structureScore),
  }

  const weakAreas: string[] = []
  for (const [area, scores] of Object.entries(scoresByCategory)) {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < 6) weakAreas.push(area)
    }
  }

  return c.json({
    data: {
      totalInterviews: interviewRows[0].count,
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
