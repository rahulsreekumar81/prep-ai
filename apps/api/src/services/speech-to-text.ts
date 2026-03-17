import { getGroqClient } from '../lib/ai-client'

// Common Whisper hallucinations on silence/noise
const HALLUCINATION_PATTERNS = [
  /thanks?\s*(for\s+watching|for\s+listening)/i,
  /subscribe/i,
  /like\s+and\s+subscribe/i,
  /^you\.?$/i,
  /^\s*\.+\s*$/,
  /^\s*,+\s*$/,
]

// Phrases that appear at the start or end of transcripts as hallucinations
const STRIP_PHRASES = [
  'thank you',
  'thanks',
  'thanks for watching',
  'thank you for watching',
  'thanks for listening',
  'thank you for listening',
  'bye',
  'goodbye',
  'please subscribe',
  'like and subscribe',
]

// Full-text hallucinations (entire transcript is just this)
const FULL_HALLUCINATIONS = [
  'thank you', 'thanks', 'bye', 'goodbye', 'you', 'okay',
  'hank you', 'ank you', 'nk you',
]

function stripHallucinations(text: string): string {
  let result = text.trim()

  // Strip known phrases from start
  for (const phrase of STRIP_PHRASES) {
    const startRegex = new RegExp(`^${phrase}[.,!?\\s]*`, 'i')
    result = result.replace(startRegex, '').trim()
  }

  // Strip known phrases from end
  for (const phrase of STRIP_PHRASES) {
    const endRegex = new RegExp(`[.,!?\\s]*${phrase}[.,!?]*$`, 'i')
    result = result.replace(endRegex, '').trim()
  }

  return result
}

function isFullHallucination(text: string): boolean {
  // Check regex patterns
  if (HALLUCINATION_PATTERNS.some((p) => p.test(text))) return true

  // Normalize for short-text check
  const normalized = text.replace(/[.\s,!?]+/g, ' ').trim().toLowerCase()

  // If the entire text is just repeated short hallucination phrases
  for (const phrase of FULL_HALLUCINATIONS) {
    const cleaned = normalized.replace(new RegExp(phrase, 'gi'), '').replace(/\s+/g, '').trim()
    if (cleaned.length === 0) return true
  }

  // Very short output (under 3 real words) is suspicious
  const words = normalized.split(/\s+/).filter((w) => w.length > 1)
  if (words.length <= 2) return true

  return false
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const groq = getGroqClient()

  const file = new File([new Uint8Array(audioBuffer)], 'recording.webm', { type: 'audio/webm' })

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'en',
    prompt: 'This is a mock interview answer. The speaker is answering an interview question.',
  })

  const rawText = transcription.text?.trim()

  if (!rawText || rawText.length === 0) {
    throw new Error('Transcription returned empty text. Please try recording again.')
  }

  // First check if the entire raw text is a hallucination
  if (isFullHallucination(rawText)) {
    throw new Error('Could not detect clear speech. Please speak louder and try again.')
  }

  // Strip hallucinated phrases from start/end while keeping real content
  const cleaned = stripHallucinations(rawText)

  if (!cleaned || cleaned.length === 0) {
    throw new Error('Could not detect clear speech. Please speak louder and try again.')
  }

  return cleaned
}
