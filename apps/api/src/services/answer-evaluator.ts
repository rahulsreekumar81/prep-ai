import { generateText } from 'ai'
import { getGroqProvider } from '../lib/ai-client'
import { answerEvaluationPrompt } from '../prompts/answer-evaluation'
import { codeEvaluationPrompt } from '../prompts/code-evaluation'

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

interface CodeEvaluateInput {
  question: string
  title: string
  code: string
  language: string
  testCases: Array<{ input: string; expected: string }>
  jobDescription: string
  companyName: string
}

export interface CodeEvaluation {
  correctnessScore: number
  efficiencyScore: number
  codeQualityScore: number
  edgeCaseScore: number
  overallScore: number
  feedback: string
  bugs: string[]
  optimizedSolution: string
  complexityAnalysis: {
    candidateTime: string
    candidateSpace: string
    optimalTime: string
    optimalSpace: string
  }
  tips: string[]
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(10, Math.round(score)))
}

export async function evaluateAnswer(input: EvaluateInput): Promise<Evaluation> {
  const prompt = answerEvaluationPrompt(input)

  const { text } = await generateText({
    model: getGroqProvider()('llama-3.3-70b-versatile'),
    prompt,
    maxTokens: 2048,
    temperature: 0.3,
  })

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    const parsed = JSON.parse(jsonMatch[0])

    const relevanceScore = clampScore(parsed.relevanceScore || parsed.relevance_score || 5)
    const depthScore = clampScore(parsed.depthScore || parsed.depth_score || 5)
    const clarityScore = clampScore(parsed.clarityScore || parsed.clarity_score || 5)
    const structureScore = clampScore(parsed.structureScore || parsed.structure_score || 5)

    return {
      relevanceScore,
      depthScore,
      clarityScore,
      structureScore,
      overallScore:
        Math.round(((relevanceScore + depthScore + clarityScore + structureScore) / 4) * 10) / 10,
      feedback: String(parsed.feedback || 'No feedback generated.'),
      sampleAnswer: String(
        parsed.sampleAnswer || parsed.sample_answer || 'No sample answer generated.',
      ),
      tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : ['Try to be more specific.'],
    }
  } catch (err) {
    console.warn('Failed to parse evaluation JSON, returning text as feedback:', err)

    return {
      relevanceScore: 5,
      depthScore: 5,
      clarityScore: 5,
      structureScore: 5,
      overallScore: 5,
      feedback: text.slice(0, 1000),
      sampleAnswer: 'Could not generate a structured sample answer.',
      tips: ['Try to structure your answer using the STAR format.'],
    }
  }
}

export async function evaluateCode(input: CodeEvaluateInput): Promise<CodeEvaluation> {
  const prompt = codeEvaluationPrompt(input)

  const { text } = await generateText({
    model: getGroqProvider()('llama-3.3-70b-versatile'),
    prompt,
    maxTokens: 3000,
    temperature: 0.3,
  })

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    const parsed = JSON.parse(jsonMatch[0])

    const correctnessScore = clampScore(parsed.correctnessScore || parsed.correctness_score || 5)
    const efficiencyScore = clampScore(parsed.efficiencyScore || parsed.efficiency_score || 5)
    const codeQualityScore = clampScore(parsed.codeQualityScore || parsed.code_quality_score || 5)
    const edgeCaseScore = clampScore(parsed.edgeCaseScore || parsed.edge_case_score || 5)

    return {
      correctnessScore,
      efficiencyScore,
      codeQualityScore,
      edgeCaseScore,
      overallScore:
        Math.round(
          ((correctnessScore + efficiencyScore + codeQualityScore + edgeCaseScore) / 4) * 10,
        ) / 10,
      feedback: String(parsed.feedback || 'No feedback generated.'),
      bugs: Array.isArray(parsed.bugs) ? parsed.bugs.map(String) : [],
      optimizedSolution: String(
        parsed.optimizedSolution || parsed.optimized_solution || 'No optimized solution generated.',
      ),
      complexityAnalysis: {
        candidateTime: String(parsed.complexityAnalysis?.candidateTime || 'N/A'),
        candidateSpace: String(parsed.complexityAnalysis?.candidateSpace || 'N/A'),
        optimalTime: String(parsed.complexityAnalysis?.optimalTime || 'N/A'),
        optimalSpace: String(parsed.complexityAnalysis?.optimalSpace || 'N/A'),
      },
      tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : ['Consider edge cases.'],
    }
  } catch (err) {
    console.warn('Failed to parse code evaluation JSON:', err)

    return {
      correctnessScore: 5,
      efficiencyScore: 5,
      codeQualityScore: 5,
      edgeCaseScore: 5,
      overallScore: 5,
      feedback: text.slice(0, 1000),
      bugs: [],
      optimizedSolution: 'Could not generate an optimized solution.',
      complexityAnalysis: {
        candidateTime: 'N/A',
        candidateSpace: 'N/A',
        optimalTime: 'N/A',
        optimalSpace: 'N/A',
      },
      tips: ['Review your solution for correctness and edge cases.'],
    }
  }
}
