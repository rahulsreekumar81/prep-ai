import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  pgEnum,
  index,
  customType,
} from 'drizzle-orm/pg-core'

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1024)'
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value)
  },
})

// Enums
export const planEnum = pgEnum('plan', ['free', 'pro', 'premium'])
export const interviewStatusEnum = pgEnum('interview_status', ['in_progress', 'completed'])
export const questionTypeEnum = pgEnum('question_type', [
  'technical',
  'behavioral',
  'system_design',
  'situational',
  'dsa',
])
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])
export const roundTypeEnum = pgEnum('round_type', [
  'oa',
  'phone_screen',
  'coding',
  'system_design',
  'behavioral',
  'mixed',
])
export const attemptStatusEnum = pgEnum('attempt_status', [
  'in_progress',
  'passed',
  'failed',
  'abandoned',
])
export const roundSessionStatusEnum = pgEnum('round_session_status', [
  'pending',
  'in_progress',
  'completed',
  'passed',
  'failed',
])

// Tables
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  plan: planEnum('plan').default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const resumes = pgTable('resumes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  fileUrl: text('file_url'),
  parsedText: text('parsed_text').notNull(),
  skills: jsonb('skills').$type<string[]>().default([]),
  experienceYears: integer('experience_years'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const interviews = pgTable('interviews', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  resumeId: text('resume_id').references(() => resumes.id),
  jobDescription: text('job_description').notNull(),
  companyName: text('company_name'),
  roleTitle: text('role_title'),
  status: interviewStatusEnum('status').default('in_progress').notNull(),
  overallScore: real('overall_score'),
  fitScore: integer('fit_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const companyPipelines = pgTable('company_pipelines', {
  id: text('id').primaryKey(),
  company: text('company').notNull(),
  role: text('role').notNull(),
  description: text('description'),
  totalRounds: integer('total_rounds').notNull().default(0),
  passingThreshold: real('passing_threshold').notNull().default(0.6),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pipelineRounds = pgTable('pipeline_rounds', {
  id: text('id').primaryKey(),
  pipelineId: text('pipeline_id')
    .references(() => companyPipelines.id)
    .notNull(),
  name: text('name').notNull(),
  roundType: roundTypeEnum('round_type').notNull(),
  orderIndex: integer('order_index').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  questionCount: integer('question_count').notNull().default(1),
  description: text('description'),
  passingScore: real('passing_score').notNull().default(6.0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const pipelineAttempts = pgTable('pipeline_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  pipelineId: text('pipeline_id')
    .references(() => companyPipelines.id)
    .notNull(),
  resumeText: text('resume_text'),
  jobDescription: text('job_description'),
  currentRoundIndex: integer('current_round_index').notNull().default(0),
  status: attemptStatusEnum('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const roundSessions = pgTable('round_sessions', {
  id: text('id').primaryKey(),
  attemptId: text('attempt_id')
    .references(() => pipelineAttempts.id)
    .notNull(),
  roundId: text('round_id')
    .references(() => pipelineRounds.id)
    .notNull(),
  status: roundSessionStatusEnum('status').notNull().default('pending'),
  score: real('score'),
  feedback: text('feedback'),
  aiConversation: jsonb('ai_conversation')
    .$type<
      Array<{
        role: 'interviewer' | 'candidate'
        content: string
        codeSnapshot?: string
        timestamp: string
      }>
    >()
    .default([]),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
})

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  interviewId: text('interview_id').references(() => interviews.id),
  roundSessionId: text('round_session_id').references(() => roundSessions.id),
  content: text('content').notNull(),
  type: questionTypeEnum('type').notNull(),
  difficulty: difficultyEnum('difficulty').default('medium').notNull(),
  orderIndex: integer('order_index').notNull(),
  metadata: jsonb('metadata').$type<{
    title?: string
    starterCode?: Record<string, string>
    testCases?: Array<{ input: string; expected: string }>
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const evaluations = pgTable('evaluations', {
  id: text('id').primaryKey(),
  questionId: text('question_id')
    .references(() => questions.id)
    .notNull(),
  userAnswer: text('user_answer').notNull(),
  audioUrl: text('audio_url'),
  relevanceScore: integer('relevance_score').notNull(),
  depthScore: integer('depth_score').notNull(),
  clarityScore: integer('clarity_score').notNull(),
  structureScore: integer('structure_score').notNull(),
  overallScore: real('overall_score').notNull(),
  feedback: text('feedback').notNull(),
  sampleAnswer: text('sample_answer').notNull(),
  tips: jsonb('tips').$type<string[]>().default([]),
  codeAnswer: text('code_answer'),
  language: text('language'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dsaQuestionBank = pgTable('dsa_question_bank', {
  id: text('id').primaryKey(),
  company: text('company').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  difficulty: difficultyEnum('difficulty').default('medium').notNull(),
  topic: text('topic').notNull(),
  starterCode: jsonb('starter_code').$type<Record<string, string>>().notNull(),
  testCases: jsonb('test_cases').$type<Array<{ input: string; expected: string }>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const companyData = pgTable(
  'company_data',
  {
    id: text('id').primaryKey(),
    company: text('company').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdx: index('company_idx').on(table.company),
  }),
)

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  plan: planEnum('plan').notNull(),
  status: text('status').default('active').notNull(),
  razorpaySubId: text('razorpay_sub_id'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
