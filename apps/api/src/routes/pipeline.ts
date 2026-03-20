import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import {
  companyPipelines,
  pipelineRounds,
  pipelineAttempts,
  roundSessions,
  questions,
  evaluations,
} from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import { startRound, completeRound } from '../services/pipeline-manager'
import { generateId } from '../lib/id'
import type { AuthVariables } from '../types'

export const pipelineRoutes = new Hono<{ Variables: AuthVariables }>()

pipelineRoutes.use('*', requireAuth)

// List all company pipelines
pipelineRoutes.get('/', async (c) => {
  const db = getDb()
  const pipelines = await db.select().from(companyPipelines)

  const result = await Promise.all(
    pipelines.map(async (p) => {
      const rounds = await db
        .select()
        .from(pipelineRounds)
        .where(eq(pipelineRounds.pipelineId, p.id))
        .orderBy(pipelineRounds.orderIndex)
      return { ...p, rounds }
    }),
  )

  return c.json({ data: { pipelines: result } })
})

// Get pipelines for a specific company
pipelineRoutes.get('/company/:company', async (c) => {
  const company = c.req.param('company')
  const db = getDb()

  const pipelines = await db
    .select()
    .from(companyPipelines)
    .where(eq(companyPipelines.company, company))

  if (pipelines.length === 0) {
    return c.json({ error: 'No pipelines found for this company' }, 404)
  }

  const result = await Promise.all(
    pipelines.map(async (p) => {
      const rounds = await db
        .select()
        .from(pipelineRounds)
        .where(eq(pipelineRounds.pipelineId, p.id))
        .orderBy(pipelineRounds.orderIndex)
      return { ...p, rounds }
    }),
  )

  return c.json({ data: { pipelines: result } })
})

// Start a pipeline attempt
pipelineRoutes.post(
  '/attempts',
  zValidator(
    'json',
    z.object({
      pipelineId: z.string(),
      resumeText: z.string().optional(),
      jobDescription: z.string().optional(),
    }),
  ),
  async (c) => {
    const { pipelineId, resumeText, jobDescription } = c.req.valid('json')
    const userId = c.get('userId')
    const db = getDb()

    const pipeline = await db
      .select()
      .from(companyPipelines)
      .where(eq(companyPipelines.id, pipelineId))
      .limit(1)

    if (pipeline.length === 0) {
      return c.json({ error: 'Pipeline not found' }, 404)
    }

    const rounds = await db
      .select()
      .from(pipelineRounds)
      .where(eq(pipelineRounds.pipelineId, pipelineId))
      .orderBy(pipelineRounds.orderIndex)

    const attemptId = generateId('pa')

    await db.insert(pipelineAttempts).values({
      id: attemptId,
      userId,
      pipelineId,
      resumeText: resumeText || null,
      jobDescription: jobDescription || null,
      currentRoundIndex: 0,
      status: 'in_progress',
    })

    // Create pending round sessions for all rounds
    const sessionValues = rounds.map((r) => ({
      id: generateId('rs'),
      attemptId,
      roundId: r.id,
      status: 'pending' as const,
    }))

    if (sessionValues.length > 0) {
      await db.insert(roundSessions).values(sessionValues)
    }

    return c.json({
      data: {
        attemptId,
        pipelineId,
        totalRounds: rounds.length,
        sessions: sessionValues.map((s, i) => ({
          id: s.id,
          roundId: s.roundId,
          roundName: rounds[i].name,
          status: s.status,
        })),
      },
    })
  },
)

// Get a pipeline attempt with all round sessions
pipelineRoutes.get('/attempts/:id', async (c) => {
  const attemptId = c.req.param('id')
  const userId = c.get('userId')
  const db = getDb()

  const attempt = await db
    .select()
    .from(pipelineAttempts)
    .where(and(eq(pipelineAttempts.id, attemptId), eq(pipelineAttempts.userId, userId)))
    .limit(1)

  if (attempt.length === 0) {
    return c.json({ error: 'Attempt not found' }, 404)
  }

  const pipeline = await db
    .select()
    .from(companyPipelines)
    .where(eq(companyPipelines.id, attempt[0].pipelineId))
    .limit(1)

  const rounds = await db
    .select()
    .from(pipelineRounds)
    .where(eq(pipelineRounds.pipelineId, attempt[0].pipelineId))
    .orderBy(pipelineRounds.orderIndex)

  const sessions = await db
    .select()
    .from(roundSessions)
    .where(eq(roundSessions.attemptId, attemptId))

  const roundsWithSessions = rounds.map((r) => {
    const session = sessions.find((s) => s.roundId === r.id)
    return {
      ...r,
      session: session
        ? {
            id: session.id,
            status: session.status,
            score: session.score,
            feedback: session.feedback,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
          }
        : null,
    }
  })

  return c.json({
    data: {
      attempt: attempt[0],
      pipeline: pipeline[0],
      rounds: roundsWithSessions,
    },
  })
})

// Start a round session — generates questions
pipelineRoutes.post('/round-sessions/:id/start', async (c) => {
  const roundSessionId = c.req.param('id')
  const db = getDb()

  // Verify the session belongs to this user
  const sessionData = await db
    .select({
      session: roundSessions,
      attempt: pipelineAttempts,
    })
    .from(roundSessions)
    .innerJoin(pipelineAttempts, eq(roundSessions.attemptId, pipelineAttempts.id))
    .where(eq(roundSessions.id, roundSessionId))
    .limit(1)

  if (sessionData.length === 0) {
    return c.json({ error: 'Round session not found' }, 404)
  }

  const userId = c.get('userId')
  if (sessionData[0].attempt.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const result = await startRound(roundSessionId)
  return c.json({ data: result })
})

// Complete a round — compute score and advance
pipelineRoutes.post('/round-sessions/:id/complete', async (c) => {
  const roundSessionId = c.req.param('id')
  const userId = c.get('userId')
  const db = getDb()

  const sessionData = await db
    .select({
      session: roundSessions,
      attempt: pipelineAttempts,
    })
    .from(roundSessions)
    .innerJoin(pipelineAttempts, eq(roundSessions.attemptId, pipelineAttempts.id))
    .where(eq(roundSessions.id, roundSessionId))
    .limit(1)

  if (sessionData.length === 0) {
    return c.json({ error: 'Round session not found' }, 404)
  }

  if (sessionData[0].attempt.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const result = await completeRound(roundSessionId)
  return c.json({ data: result })
})

// Get questions for a round session
pipelineRoutes.get('/round-sessions/:id/questions', async (c) => {
  const roundSessionId = c.req.param('id')
  const userId = c.get('userId')
  const db = getDb()

  const sessionData = await db
    .select({
      session: roundSessions,
      attempt: pipelineAttempts,
    })
    .from(roundSessions)
    .innerJoin(pipelineAttempts, eq(roundSessions.attemptId, pipelineAttempts.id))
    .where(eq(roundSessions.id, roundSessionId))
    .limit(1)

  if (sessionData.length === 0) {
    return c.json({ error: 'Round session not found' }, 404)
  }

  if (sessionData[0].attempt.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const roundQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.roundSessionId, roundSessionId))
    .orderBy(questions.orderIndex)

  return c.json({ data: { questions: roundQuestions } })
})

// Get user's pipeline attempts
pipelineRoutes.get('/my-attempts', async (c) => {
  const userId = c.get('userId')
  const db = getDb()

  const attempts = await db
    .select({
      attempt: pipelineAttempts,
      pipeline: companyPipelines,
    })
    .from(pipelineAttempts)
    .innerJoin(companyPipelines, eq(pipelineAttempts.pipelineId, companyPipelines.id))
    .where(eq(pipelineAttempts.userId, userId))

  return c.json({
    data: {
      attempts: attempts.map(({ attempt, pipeline }) => ({
        ...attempt,
        company: pipeline.company,
        role: pipeline.role,
        totalRounds: pipeline.totalRounds,
      })),
    },
  })
})
