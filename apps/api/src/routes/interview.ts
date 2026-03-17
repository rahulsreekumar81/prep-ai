import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, sql } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { interviews, questions, resumes, dsaQuestionBank } from '@prepai/db/schema'
import { requireAuth } from '../middleware/auth'
import { generateQuestions } from '../services/question-generator'
import { parseResume } from '../services/resume-parser'
import { transcribeAudio } from '../services/speech-to-text'
import { getCompanyContext } from '../services/rag'
import { generateId } from '../lib/id'
import type { AuthVariables } from '../types'

const createInterviewSchema = z.object({
  resumeText: z.string().min(10, 'Resume text is too short'),
  jobDescription: z.string().min(10, 'Job description is too short'),
  companyName: z.string().optional(),
  roleTitle: z.string().optional(),
})

export const interviewRoutes = new Hono<{ Variables: AuthVariables }>()

interviewRoutes.use('*', requireAuth)

// Start a new interview session
interviewRoutes.post('/', zValidator('json', createInterviewSchema), async (c) => {
  const { resumeText, jobDescription, companyName, roleTitle } = c.req.valid('json')
  const userId = c.get('userId')
  const db = getDb()

  // Get company-specific context via RAG
  let companyContext: Array<{ content: string }> = []
  if (companyName) {
    try {
      companyContext = await getCompanyContext(companyName, roleTitle || '')
    } catch (err) {
      console.warn('RAG lookup failed, continuing without company context:', err)
    }
  }

  // Generate custom questions using AI (7 instead of 10, DSA fills the rest)
  const generatedQuestions = await generateQuestions({
    resumeText,
    jobDescription,
    companyName: companyName || 'Unknown',
    roleTitle: roleTitle || 'Software Engineer',
    companyContext,
  })

  const interviewId = generateId('int')

  await db.insert(interviews).values({
    id: interviewId,
    userId,
    jobDescription,
    companyName: companyName || null,
    roleTitle: roleTitle || null,
    status: 'in_progress',
  })

  // Insert AI-generated questions (behavioral/technical/situational)
  const questionRecords = generatedQuestions.map((q, i) => ({
    id: generateId('q'),
    interviewId,
    content: q.content,
    type: q.type as 'technical' | 'behavioral' | 'system_design' | 'situational',
    difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
    orderIndex: i + 1,
  }))

  await db.insert(questions).values(questionRecords)

  // Pick 3 DSA questions from the bank for this company (or random)
  let dsaQuestions: typeof dsaQuestionBank.$inferSelect[] = []

  if (companyName) {
    // Try company-specific questions first
    dsaQuestions = await db
      .select()
      .from(dsaQuestionBank)
      .where(sql`lower(${dsaQuestionBank.company}) = lower(${companyName})`)
      .orderBy(sql`random()`)
      .limit(3)
  }

  // Fall back to random questions if no company match
  if (dsaQuestions.length < 3) {
    dsaQuestions = await db
      .select()
      .from(dsaQuestionBank)
      .orderBy(sql`random()`)
      .limit(3)
  }

  // Insert DSA questions with metadata
  const dsaRecords = dsaQuestions.map((dq, i) => ({
    id: generateId('q'),
    interviewId,
    content: dq.content,
    type: 'dsa' as const,
    difficulty: dq.difficulty,
    orderIndex: questionRecords.length + i + 1,
    metadata: {
      title: dq.title,
      starterCode: dq.starterCode,
      testCases: dq.testCases,
    },
  }))

  if (dsaRecords.length > 0) {
    await db.insert(questions).values(dsaRecords)
  }

  const allQuestions = [...questionRecords, ...dsaRecords].map((q) => ({
    id: q.id,
    content: q.content,
    type: q.type,
    difficulty: q.difficulty,
    orderIndex: q.orderIndex,
    metadata: 'metadata' in q ? q.metadata : null,
  }))

  return c.json({
    data: {
      id: interviewId,
      status: 'in_progress',
      companyName,
      roleTitle,
      questions: allQuestions,
    },
  })
})

// List past interviews
interviewRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const db = getDb()

  const result = await db
    .select()
    .from(interviews)
    .where(eq(interviews.userId, userId))
    .orderBy(desc(interviews.createdAt))
    .limit(20)

  return c.json({ data: { interviews: result } })
})

// Get interview by ID with questions
interviewRoutes.get('/:id', async (c) => {
  const interviewId = c.req.param('id')
  const userId = c.get('userId')
  const db = getDb()

  const interviewResult = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1)

  if (interviewResult.length === 0) {
    return c.json({ error: 'Interview not found' }, 404)
  }

  const interview = interviewResult[0]

  if (interview.userId !== userId) {
    return c.json({ error: 'Not authorized' }, 403)
  }

  const interviewQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.interviewId, interviewId))
    .orderBy(questions.orderIndex)

  return c.json({
    data: {
      interview,
      questions: interviewQuestions,
    },
  })
})

// Upload and parse resume PDF
interviewRoutes.post('/upload-resume', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    return c.json({ error: 'No PDF file uploaded' }, 400)
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File too large. Max 5MB.' }, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))
  const parsed = await parseResume(buffer)

  const db = getDb()
  const resumeId = generateId('res')

  await db.insert(resumes).values({
    id: resumeId,
    userId,
    parsedText: parsed.text,
  })

  return c.json({
    data: {
      id: resumeId,
      text: parsed.text,
      pages: parsed.pages,
    },
  })
})

// Transcribe audio answer
interviewRoutes.post('/:id/transcribe', async (c) => {
  const body = await c.req.parseBody()
  const audio = body['audio']

  if (!(audio instanceof File)) {
    return c.json({ error: 'No audio file uploaded' }, 400)
  }

  const arrayBuffer = await audio.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))
  const transcript = await transcribeAudio(buffer)

  return c.json({ data: { transcript } })
})

// Mark interview as complete
interviewRoutes.post('/:id/complete', async (c) => {
  const interviewId = c.req.param('id')
  const userId = c.get('userId')
  const db = getDb()

  const interviewResult = await db
    .select()
    .from(interviews)
    .where(eq(interviews.id, interviewId))
    .limit(1)

  if (interviewResult.length === 0 || interviewResult[0].userId !== userId) {
    return c.json({ error: 'Interview not found' }, 404)
  }

  await db
    .update(interviews)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(interviews.id, interviewId))

  return c.json({ data: { message: 'Interview completed' } })
})
