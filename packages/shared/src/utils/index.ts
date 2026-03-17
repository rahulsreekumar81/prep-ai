import { createId } from '@paralleldrive/cuid2'

export function generateId(prefix: string = ''): string {
  const id = createId()
  return prefix ? `${prefix}_${id}` : id
}

export function calculateOverallScore(scores: {
  relevance: number
  depth: number
  clarity: number
  structure: number
}): number {
  const { relevance, depth, clarity, structure } = scores
  return Math.round(((relevance + depth + clarity + structure) / 4) * 10) / 10
}

export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
