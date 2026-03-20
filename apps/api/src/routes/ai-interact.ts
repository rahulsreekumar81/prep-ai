import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { streamText } from 'ai'
import { getDb } from '@prepai/db'
import {
  roundSessions,
  pipelineAttempts,
  pipelineRounds,
  companyPipelines,
  questions,
} from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import { getGroqProvider } from '../lib/ai-client'
import { dsaInterviewerPrompt } from '../prompts/dsa-interviewer'
import type { AuthVariables } from '../types'

const MAX_INTERACTIONS = 20
const MIN_INTERACTION_GAP_MS = 4000

// Per-session throttle: sessionId → last interaction timestamp
const lastInteractionMap = new Map<string, number>()

export const aiInteractRoutes = new Hono<{ Variables: AuthVariables }>()

aiInteractRoutes.use('*', requireAuth)

aiInteractRoutes.post(
  '/round-sessions/:id/ai-interact',
  zValidator(
    'json',
    z.object({
      code: z.string().default(''),
      message: z.string().optional(),
    }),
  ),
  async (c) => {
    const roundSessionId = c.req.param('id')
    const { code, message } = c.req.valid('json')
    const userId = c.get('userId')
    const db = getDb()

    // Load session + related data
    const sessionData = await db
      .select({
        session: roundSessions,
        round: pipelineRounds,
        attempt: pipelineAttempts,
      })
      .from(roundSessions)
      .innerJoin(pipelineRounds, eq(roundSessions.roundId, pipelineRounds.id))
      .innerJoin(pipelineAttempts, eq(roundSessions.attemptId, pipelineAttempts.id))
      .where(eq(roundSessions.id, roundSessionId))
      .limit(1)

    if (sessionData.length === 0) {
      return c.json({ error: 'Round session not found' }, 404)
    }

    const { session, round, attempt } = sessionData[0]

    if (attempt.userId !== userId) {
      return c.json({ error: 'Not authorized' }, 403)
    }

    if (session.status !== 'in_progress') {
      return c.json({ error: 'Round is not in progress' }, 400)
    }

    // Check interaction count
    const conversation = (session.aiConversation as Array<{ role: string }>) || []
    const interviewerMessages = conversation.filter((m) => m.role === 'interviewer').length

    if (interviewerMessages >= MAX_INTERACTIONS) {
      return c.json(
        {
          error: 'Maximum interactions reached',
          status: 'limit_reached',
        },
        429,
      )
    }

    // Server-side throttle
    const lastTime = lastInteractionMap.get(roundSessionId) || 0
    const now = Date.now()
    if (now - lastTime < MIN_INTERACTION_GAP_MS) {
      const retryAfter = Math.ceil((MIN_INTERACTION_GAP_MS - (now - lastTime)) / 1000)
      return c.json({ status: 'throttled', retryAfter }, 429)
    }
    lastInteractionMap.set(roundSessionId, now)

    // Load the first question for this round (to get problem details)
    const roundQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.roundSessionId, roundSessionId))
      .orderBy(questions.orderIndex)
      .limit(1)

    const firstQuestion = roundQuestions[0]
    const metadata = firstQuestion?.metadata as {
      title?: string
      testCases?: Array<{ input: string; expected: string }>
    } | null

    const pipeline = await db
      .select()
      .from(companyPipelines)
      .where(eq(companyPipelines.id, attempt.pipelineId))
      .limit(1)

    const company = pipeline[0]?.company || 'the company'

    // Build interviewer context
    const aiConversation = (
      session.aiConversation as Array<{
        role: 'interviewer' | 'candidate'
        content: string
        timestamp: string
      }>
    ) || []

    const prompt = dsaInterviewerPrompt({
      company,
      roundName: round.name,
      problemTitle: metadata?.title || firstQuestion?.content?.split('\n')[0] || 'Coding Problem',
      problemContent: firstQuestion?.content || 'No problem loaded yet.',
      testCases: metadata?.testCases || [],
      conversationHistory: aiConversation,
      currentCode: code,
      interactionCount: interviewerMessages,
      maxInteractions: MAX_INTERACTIONS,
    })

    // If user sent a message, append it to conversation before streaming
    const userMessage = message?.trim() || (code.trim() ? '[Code update]' : '[Session started]')

    // Stream the AI response
    const result = await streamText({
      model: getGroqProvider()('llama-3.1-8b-instant'),
      prompt,
      maxTokens: 200,
      temperature: 0.7,
    })

    // After streaming, save the exchange to DB
    // We collect the full text via the stream
    let fullResponse = ''
    const stream = result.toDataStreamResponse()

    // Use a transform approach: collect text then update DB
    // We do this async after returning the stream
    result.text.then(async (text) => {
      fullResponse = text
      const newConversation = [
        ...aiConversation,
        {
          role: 'candidate' as const,
          content: userMessage,
          codeSnapshot: code.slice(0, 2000),
          timestamp: new Date().toISOString(),
        },
        {
          role: 'interviewer' as const,
          content: fullResponse,
          timestamp: new Date().toISOString(),
        },
      ]

      await db
        .update(roundSessions)
        .set({ aiConversation: newConversation })
        .where(eq(roundSessions.id, roundSessionId))
    })

    return stream
  },
)

// Get conversation history for a round session
aiInteractRoutes.get('/round-sessions/:id/conversation', async (c) => {
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

  const conversation = sessionData[0].session.aiConversation || []
  const interactionCount = (conversation as Array<{ role: string }>).filter(
    (m) => m.role === 'interviewer',
  ).length

  return c.json({
    data: {
      conversation,
      interactionCount,
      maxInteractions: MAX_INTERACTIONS,
    },
  })
})
