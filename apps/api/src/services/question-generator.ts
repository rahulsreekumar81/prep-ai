import { generateText } from 'ai'
import { getGroqProvider } from '../lib/ai-client'
import { questionGenerationPrompt } from '../prompts/question-generation'

interface GenerateQuestionsInput {
  resumeText: string
  jobDescription: string
  companyName: string
  roleTitle: string
  companyContext: Array<{ content: string }>
}

export interface GeneratedQuestion {
  content: string
  type: 'technical' | 'behavioral' | 'system_design' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
}

const VALID_TYPES = ['technical', 'behavioral', 'system_design', 'situational'] as const
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GeneratedQuestion[]> {
  const prompt = questionGenerationPrompt(input)

  const { text } = await generateText({
    model: getGroqProvider()('llama-3.3-70b-versatile'),
    prompt,
    maxTokens: 2048,
    temperature: 0.7,
  })

  try {
    // Try to extract JSON from the response (handles markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    const parsed = JSON.parse(jsonMatch[0])
    const rawQuestions = parsed.questions || parsed

    if (!Array.isArray(rawQuestions)) throw new Error('Questions is not an array')

    return rawQuestions.slice(0, 7).map((q: any) => ({
      content: String(q.content || q.question || q.text || ''),
      type: VALID_TYPES.includes(q.type) ? q.type : 'technical',
      difficulty: VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'medium',
    }))
  } catch (err) {
    console.warn('Failed to parse AI response as JSON, extracting questions from text:', err)

    // Fallback: extract numbered questions from text
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\d+[\.\)]\s/.test(l))

    if (lines.length === 0) {
      throw new Error('Failed to generate questions. AI response was not in expected format.')
    }

    return lines.slice(0, 7).map((line) => ({
      content: line.replace(/^\d+[\.\)]\s*/, ''),
      type: 'technical' as const,
      difficulty: 'medium' as const,
    }))
  }
}
