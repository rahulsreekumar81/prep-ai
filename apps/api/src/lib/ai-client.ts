import { createGroq } from '@ai-sdk/groq'
import Groq from 'groq-sdk'

// Vercel AI SDK provider (for generateText/streamText)
export function getGroqProvider() {
  return createGroq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

// Raw Groq SDK (for whisper + direct API calls)
let groqInstance: Groq | null = null

export function getGroqClient(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqInstance
}
