import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { submitAnswerSchema } from '@prepai/shared/validators'
import { evaluateAnswer } from '../services/answer-evaluator'

export const evaluationRoutes = new Hono()

// Submit answer and get evaluation
evaluationRoutes.post('/', zValidator('json', submitAnswerSchema), async (c) => {
  const { question, answer, jobDescription, companyName } = c.req.valid('json')

  const evaluation = await evaluateAnswer({
    question,
    answer,
    jobDescription,
    companyName: companyName || 'Unknown',
  })

  return c.json({ data: evaluation })
})
