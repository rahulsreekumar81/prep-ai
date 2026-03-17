export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  plan: 'free' | 'pro' | 'premium'
  createdAt: Date
}

export interface Interview {
  id: string
  userId: string
  resumeId: string | null
  jobDescription: string
  companyName: string | null
  roleTitle: string | null
  status: 'in_progress' | 'completed'
  overallScore: number | null
  fitScore: number | null
  createdAt: Date
  completedAt: Date | null
}

export interface Question {
  id: string
  interviewId: string
  content: string
  type: 'technical' | 'behavioral' | 'system_design' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  orderIndex: number
}

export interface Evaluation {
  id: string
  questionId: string
  userAnswer: string
  audioUrl: string | null
  relevanceScore: number
  depthScore: number
  clarityScore: number
  structureScore: number
  overallScore: number
  feedback: string
  sampleAnswer: string
  tips: string[]
}

export interface DashboardStats {
  totalInterviews: number
  averageScore: number
  streak: number
  weakAreas: string[]
  recentInterviews: Interview[]
}
