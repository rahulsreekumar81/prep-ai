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
])
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])

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

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  interviewId: text('interview_id')
    .references(() => interviews.id)
    .notNull(),
  content: text('content').notNull(),
  type: questionTypeEnum('type').notNull(),
  difficulty: difficultyEnum('difficulty').default('medium').notNull(),
  orderIndex: integer('order_index').notNull(),
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
