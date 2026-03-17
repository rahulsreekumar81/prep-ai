import { generateText } from 'ai'
import { groqClient } from '../lib/ai-client'
import { questionGenerationPrompt } from '../prompts/question-generation'

interface GenerateQuestionsInput {
  resumeText: string
  jobDescription: string
  companyName: string
  roleTitle: string
  companyContext: Array<{ content: string }>
}

export interface GeneratedQuestion {
  id: string
  content: string
  type: 'technical' | 'behavioral' | 'system_design' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  orderIndex: number
}

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GeneratedQuestion[]> {
  const prompt = questionGenerationPrompt(input)

  const { text } = await generateText({
    model: groqClient('llama-3.1-70b-versatile'),
    prompt,
    maxTokens: 2048,
  })

  try {
    const parsed = JSON.parse(text)
    return parsed.questions.map((q: any, i: number) => ({
      id: `q_${Date.now()}_${i}`,
      content: q.content,
      type: q.type || 'technical',
      difficulty: q.difficulty || 'medium',
      orderIndex: i + 1,
    }))
  } catch {
    // Fallback: if JSON parsing fails, return raw questions
    const lines = text.split('\n').filter((l) => l.trim())
    return lines.slice(0, 10).map((line, i) => ({
      id: `q_${Date.now()}_${i}`,
      content: line.replace(/^\d+\.\s*/, ''),
      type: 'technical' as const,
      difficulty: 'medium' as const,
      orderIndex: i + 1,
    }))
  }
}
