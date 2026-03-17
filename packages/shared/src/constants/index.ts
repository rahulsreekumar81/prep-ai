export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const

export const FREE_INTERVIEW_LIMIT = 3
export const MAX_QUESTIONS_PER_INTERVIEW = 10
export const MAX_RESUME_SIZE_MB = 5

export const QUESTION_TYPES = ['technical', 'behavioral', 'system_design', 'situational'] as const

export const SUPPORTED_COMPANIES = [
  'Google',
  'Amazon',
  'Microsoft',
  'Meta',
  'Apple',
  'Razorpay',
  'Flipkart',
  'Swiggy',
  'PhonePe',
  'CRED',
  'Zerodha',
  'Atlassian',
  'Samsung',
  'Adobe',
  'Intuit',
  'Walmart',
] as const
