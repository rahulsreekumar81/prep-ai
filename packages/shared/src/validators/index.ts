import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const createInterviewSchema = z.object({
  resumeText: z.string().min(10),
  jobDescription: z.string().min(10),
  companyName: z.string().optional(),
  roleTitle: z.string().optional(),
})

export const submitAnswerSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  jobDescription: z.string().min(1),
  companyName: z.string().optional(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
