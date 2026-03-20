import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { evaluations, questions, interviews } from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import { evaluateAnswer, evaluateCode } from '../services/answer-evaluator'
import { generateId } from '../lib/id'
import type { AuthVariables } from '../types'

const submitAnswerSchema = z.object({
  questionId: z.string(),
  interviewId: z.string(),
  answer: z.string().min(1, 'Answer cannot be empty'),
  codeAnswer: z.string().optional(),
  language: z.string().optional(),
})

export const evaluationRoutes = new Hono<{ Variables: AuthVariables }>()

evaluationRoutes.use('*', requireAuth)

// Submit answer and get AI evaluation
evaluationRoutes.post('/', zValidator('json', submitAnswerSchema), async (c) => {
  const { questionId, interviewId, answer, codeAnswer, language } = c.req.valid('json')
  const db = getDb()

  const questionResult = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1)

  if (questionResult.length === 0) {
    return c.json({ error: 'Question not found' }, 404)
  }

  // Pipeline submissions use "pipeline-{attemptId}" as interviewId — skip interview lookup
  let jobDescription = 'Software Engineer position'
  let companyName = 'Unknown'

  if (!interviewId.startsWith('pipeline-')) {
    const interviewResult = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId))
      .limit(1)

    if (interviewResult.length === 0) {
      return c.json({ error: 'Interview not found' }, 404)
    }
    jobDescription = interviewResult[0].jobDescription
    companyName = interviewResult[0].companyName || 'Unknown'
  }

  const question = questionResult[0]
  const interview = { jobDescription, companyName }

  // DSA code evaluation
  if (question.type === 'dsa' && codeAnswer && language) {
    const metadata = question.metadata as {
      title?: string
      testCases?: Array<{ input: string; expected: string }>
    } | null

    const codeEval = await evaluateCode({
      question: question.content,
      title: metadata?.title || 'DSA Problem',
      code: codeAnswer,
      language,
      testCases: metadata?.testCases || [],
      jobDescription: interview.jobDescription,
      companyName: interview.companyName || 'Unknown',
    })

    const evalId = generateId('eval')

    await db.insert(evaluations).values({
      id: evalId,
      questionId,
      userAnswer: answer || 'See code submission',
      codeAnswer,
      language,
      // Map code scores to the existing schema columns
      relevanceScore: codeEval.correctnessScore,
      depthScore: codeEval.efficiencyScore,
      clarityScore: codeEval.codeQualityScore,
      structureScore: codeEval.edgeCaseScore,
      overallScore: codeEval.overallScore,
      feedback: codeEval.feedback,
      sampleAnswer: codeEval.optimizedSolution,
      tips: [
        ...codeEval.tips,
        ...(codeEval.bugs.length > 0 ? [`Bugs found: ${codeEval.bugs.join('; ')}`] : []),
        `Complexity - Your solution: Time ${codeEval.complexityAnalysis.candidateTime}, Space ${codeEval.complexityAnalysis.candidateSpace}`,
        `Optimal: Time ${codeEval.complexityAnalysis.optimalTime}, Space ${codeEval.complexityAnalysis.optimalSpace}`,
      ],
    })

    return c.json({
      data: {
        id: evalId,
        type: 'dsa',
        correctnessScore: codeEval.correctnessScore,
        efficiencyScore: codeEval.efficiencyScore,
        codeQualityScore: codeEval.codeQualityScore,
        edgeCaseScore: codeEval.edgeCaseScore,
        overallScore: codeEval.overallScore,
        feedback: codeEval.feedback,
        bugs: codeEval.bugs,
        optimizedSolution: codeEval.optimizedSolution,
        complexityAnalysis: codeEval.complexityAnalysis,
        tips: codeEval.tips,
      },
    })
  }

  // Standard answer evaluation
  const evaluation = await evaluateAnswer({
    question: question.content,
    answer,
    jobDescription: interview.jobDescription,
    companyName: interview.companyName || 'Unknown',
  })

  const evalId = generateId('eval')

  await db.insert(evaluations).values({
    id: evalId,
    questionId,
    userAnswer: answer,
    relevanceScore: evaluation.relevanceScore,
    depthScore: evaluation.depthScore,
    clarityScore: evaluation.clarityScore,
    structureScore: evaluation.structureScore,
    overallScore: evaluation.overallScore,
    feedback: evaluation.feedback,
    sampleAnswer: evaluation.sampleAnswer,
    tips: evaluation.tips,
  })

  return c.json({
    data: {
      id: evalId,
      ...evaluation,
    },
  })
})

// Get evaluation for a specific question
evaluationRoutes.get('/:questionId', async (c) => {
  const questionId = c.req.param('questionId')
  const db = getDb()

  const result = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.questionId, questionId))
    .limit(1)

  if (result.length === 0) {
    return c.json({ error: 'Evaluation not found' }, 404)
  }

  return c.json({ data: result[0] })
})

// Get all evaluations for an interview (session summary)
evaluationRoutes.get('/interview/:interviewId', async (c) => {
  const interviewId = c.req.param('interviewId')
  const db = getDb()

  const interviewQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.interviewId, interviewId))
    .orderBy(questions.orderIndex)

  const results = await Promise.all(
    interviewQuestions.map(async (q) => {
      const evalResult = await db
        .select()
        .from(evaluations)
        .where(eq(evaluations.questionId, q.id))
        .limit(1)

      return {
        question: q,
        evaluation: evalResult[0] || null,
      }
    }),
  )

  const completedEvals = results.filter((r) => r.evaluation !== null)
  const avgScore =
    completedEvals.length > 0
      ? completedEvals.reduce((sum, r) => sum + (r.evaluation?.overallScore || 0), 0) /
        completedEvals.length
      : 0

  return c.json({
    data: {
      interviewId,
      totalQuestions: interviewQuestions.length,
      answeredQuestions: completedEvals.length,
      averageScore: Math.round(avgScore * 10) / 10,
      results,
    },
  })
})
