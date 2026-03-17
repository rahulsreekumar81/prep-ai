import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createInterviewSchema } from '@prepai/shared/validators'
import { generateQuestions } from '../services/question-generator'
import { parseResume } from '../services/resume-parser'
import { getCompanyContext } from '../services/rag'

export const interviewRoutes = new Hono()

// Start a new interview session
interviewRoutes.post('/', zValidator('json', createInterviewSchema), async (c) => {
  const { resumeText, jobDescription, companyName, roleTitle } = c.req.valid('json')

  // Get company-specific context via RAG
  const companyContext = companyName
    ? await getCompanyContext(companyName, roleTitle || '')
    : []

  // Generate custom questions
  const questions = await generateQuestions({
    resumeText,
    jobDescription,
    companyName: companyName || 'Unknown',
    roleTitle: roleTitle || 'Software Engineer',
    companyContext,
  })

  // TODO: Save interview + questions to database

  return c.json({
    data: {
      id: 'interview_' + Date.now(),
      status: 'in_progress',
      questions,
    },
  })
})

// List past interviews
interviewRoutes.get('/', async (c) => {
  // TODO: Fetch from database
  return c.json({ data: { interviews: [] } })
})

// Get interview by ID
interviewRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  // TODO: Fetch from database
  return c.json({ data: { interview: null } })
})

// Upload resume PDF
interviewRoutes.post('/upload-resume', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = await parseResume(buffer)

  return c.json({ data: parsed })
})

// Submit answer (audio)
interviewRoutes.post('/:id/questions/:qid/audio', async (c) => {
  const body = await c.req.parseBody()
  const audio = body['audio']

  if (!(audio instanceof File)) {
    return c.json({ error: 'No audio file uploaded' }, 400)
  }

  const { transcribeAudio } = await import('../services/speech-to-text')
  const buffer = Buffer.from(await audio.arrayBuffer())
  const transcript = await transcribeAudio(buffer)

  return c.json({ data: { transcript } })
})

// Mark interview as complete
interviewRoutes.post('/:id/complete', async (c) => {
  const id = c.req.param('id')
  // TODO: Calculate overall score, update database
  return c.json({ data: { message: 'Interview completed' } })
})
