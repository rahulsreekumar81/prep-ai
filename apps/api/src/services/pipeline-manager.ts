import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import {
  pipelineAttempts,
  pipelineRounds,
  roundSessions,
  companyPipelines,
  questions,
  evaluations,
  dsaQuestionBank,
} from '@prepai/db/schema'
import { generateQuestions } from './question-generator'
import { generateId } from '../lib/id'

export async function startRound(roundSessionId: string) {
  const db = getDb()

  const sessionResult = await db
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

  if (sessionResult.length === 0) throw new Error('Round session not found')

  const { session, round, attempt } = sessionResult[0]

  if (session.status !== 'pending') throw new Error('Round already started')

  // Update session to in_progress
  await db
    .update(roundSessions)
    .set({ status: 'in_progress', startedAt: new Date() })
    .where(eq(roundSessions.id, roundSessionId))

  const pipeline = await db
    .select()
    .from(companyPipelines)
    .where(eq(companyPipelines.id, attempt.pipelineId))
    .limit(1)

  const company = pipeline[0]?.company || 'Unknown'
  const questionCount = round.questionCount

  // Generate questions based on round type
  if (round.roundType === 'coding' || round.roundType === 'oa') {
    // Pull DSA questions from the bank
    let dsaQuestions: typeof dsaQuestionBank.$inferSelect[] = []

    dsaQuestions = await db
      .select()
      .from(dsaQuestionBank)
      .where(sql`lower(${dsaQuestionBank.company}) = lower(${company})`)
      .orderBy(sql`random()`)
      .limit(questionCount)

    if (dsaQuestions.length < questionCount) {
      const additional = await db
        .select()
        .from(dsaQuestionBank)
        .orderBy(sql`random()`)
        .limit(questionCount - dsaQuestions.length)
      dsaQuestions = [...dsaQuestions, ...additional]
    }

    const records = dsaQuestions.map((dq, i) => ({
      id: generateId('q'),
      roundSessionId,
      content: dq.content,
      type: 'dsa' as const,
      difficulty: dq.difficulty,
      orderIndex: i + 1,
      metadata: {
        title: dq.title,
        starterCode: dq.starterCode,
        testCases: dq.testCases,
      },
    }))

    if (records.length > 0) {
      await db.insert(questions).values(records)
    }

    return { questions: records }
  }

  if (round.roundType === 'behavioral') {
    const generated = await generateQuestions({
      resumeText: attempt.resumeText || 'General candidate',
      jobDescription: attempt.jobDescription || `${company} Software Engineer`,
      companyName: company,
      roleTitle: pipeline[0]?.role || 'Software Engineer',
      companyContext: [],
      roundType: 'behavioral',
      questionCount,
    })

    const records = generated.map((q, i) => ({
      id: generateId('q'),
      roundSessionId,
      content: q.content,
      type: q.type as 'behavioral',
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      orderIndex: i + 1,
    }))

    await db.insert(questions).values(records)
    return { questions: records }
  }

  if (round.roundType === 'system_design') {
    const generated = await generateQuestions({
      resumeText: attempt.resumeText || 'General candidate',
      jobDescription: attempt.jobDescription || `${company} Software Engineer`,
      companyName: company,
      roleTitle: pipeline[0]?.role || 'Software Engineer',
      companyContext: [],
      roundType: 'system_design',
      questionCount,
    })

    const records = generated.map((q, i) => ({
      id: generateId('q'),
      roundSessionId,
      content: q.content,
      type: q.type as 'system_design',
      difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      orderIndex: i + 1,
    }))

    await db.insert(questions).values(records)
    return { questions: records }
  }

  // phone_screen / mixed — use DSA
  let dsaQuestions = await db
    .select()
    .from(dsaQuestionBank)
    .where(sql`lower(${dsaQuestionBank.company}) = lower(${company})`)
    .orderBy(sql`random()`)
    .limit(questionCount)

  if (dsaQuestions.length < questionCount) {
    const additional = await db
      .select()
      .from(dsaQuestionBank)
      .orderBy(sql`random()`)
      .limit(questionCount - dsaQuestions.length)
    dsaQuestions = [...dsaQuestions, ...additional]
  }

  const records = dsaQuestions.map((dq, i) => ({
    id: generateId('q'),
    roundSessionId,
    content: dq.content,
    type: 'dsa' as const,
    difficulty: dq.difficulty,
    orderIndex: i + 1,
    metadata: {
      title: dq.title,
      starterCode: dq.starterCode,
      testCases: dq.testCases,
    },
  }))

  if (records.length > 0) {
    await db.insert(questions).values(records)
  }

  return { questions: records }
}

export async function completeRound(roundSessionId: string) {
  const db = getDb()

  const sessionResult = await db
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

  if (sessionResult.length === 0) throw new Error('Round session not found')

  const { session, round, attempt } = sessionResult[0]

  // Get all questions for this round session and their evaluations
  const roundQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.roundSessionId, roundSessionId))

  const evals = await Promise.all(
    roundQuestions.map(async (q) => {
      const evalResult = await db
        .select()
        .from(evaluations)
        .where(eq(evaluations.questionId, q.id))
        .limit(1)
      return evalResult[0] || null
    }),
  )

  const completedEvals = evals.filter(Boolean)
  const avgScore =
    completedEvals.length > 0
      ? completedEvals.reduce((sum, e) => sum + (e?.overallScore || 0), 0) / completedEvals.length
      : 0

  const passed = avgScore >= round.passingScore
  const newStatus = passed ? 'passed' : 'failed'

  await db
    .update(roundSessions)
    .set({
      status: newStatus,
      score: Math.round(avgScore * 10) / 10,
      completedAt: new Date(),
    })
    .where(eq(roundSessions.id, roundSessionId))

  if (!passed) {
    // Fail the pipeline attempt
    await db
      .update(pipelineAttempts)
      .set({ status: 'failed', completedAt: new Date() })
      .where(eq(pipelineAttempts.id, attempt.id))

    return { passed: false, score: avgScore, attemptStatus: 'failed' }
  }

  // Advance to next round
  const pipeline = await db
    .select()
    .from(companyPipelines)
    .where(eq(companyPipelines.id, attempt.pipelineId))
    .limit(1)

  const nextRoundIndex = attempt.currentRoundIndex + 1

  if (nextRoundIndex >= (pipeline[0]?.totalRounds || 0)) {
    // All rounds complete — pipeline passed!
    await db
      .update(pipelineAttempts)
      .set({
        status: 'passed',
        currentRoundIndex: nextRoundIndex,
        completedAt: new Date(),
      })
      .where(eq(pipelineAttempts.id, attempt.id))

    return { passed: true, score: avgScore, attemptStatus: 'passed' }
  }

  // More rounds remain
  await db
    .update(pipelineAttempts)
    .set({ currentRoundIndex: nextRoundIndex })
    .where(eq(pipelineAttempts.id, attempt.id))

  return { passed: true, score: avgScore, attemptStatus: 'in_progress', nextRoundIndex }
}
