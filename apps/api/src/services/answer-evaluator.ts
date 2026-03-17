import { generateText } from 'ai'
import { groqClient } from '../lib/ai-client'
import { answerEvaluationPrompt } from '../prompts/answer-evaluation'

interface EvaluateInput {
  question: string
  answer: string
  jobDescription: string
  companyName: string
}

export interface Evaluation {
  relevanceScore: number
  depthScore: number
  clarityScore: number
  structureScore: number
  overallScore: number
  feedback: string
  sampleAnswer: string
  tips: string[]
}

export async function evaluateAnswer(input: EvaluateInput): Promise<Evaluation> {
  const prompt = answerEvaluationPrompt(input)

  const { text } = await generateText({
    model: groqClient('llama-3.1-70b-versatile'),
    prompt,
    maxTokens: 2048,
  })

  try {
    return JSON.parse(text)
  } catch {
    return {
      relevanceScore: 5,
      depthScore: 5,
      clarityScore: 5,
      structureScore: 5,
      overallScore: 5,
      feedback: text,
      sampleAnswer: 'Could not generate sample answer.',
      tips: ['Try to be more specific with examples.'],
    }
  }
}
