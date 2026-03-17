import { createGroq } from '@ai-sdk/groq'
import Groq from 'groq-sdk'

// Vercel AI SDK provider (for generateText/streamText)
export const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Raw Groq SDK (for whisper, embeddings)
export const groqRaw = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Generate embedding for RAG
export async function generateEmbedding(text: string): Promise<number[]> {
  // Using Groq's embedding or a simple fallback
  // For MVP: use a lightweight approach
  // TODO: Replace with proper embedding model (Cohere/nomic)
  const response = await fetch('https://api.cohere.com/v1/embed', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [text],
      model: 'embed-english-v3.0',
      input_type: 'search_query',
    }),
  })

  const data = await response.json()
  return data.embeddings[0]
}
