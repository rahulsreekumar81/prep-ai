import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { createId } from '@paralleldrive/cuid2'
import { dsaQuestionBank } from '../schema/index'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface DsaQuestion {
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  starterCode: Record<string, string>
  testCases: Array<{ input: string; expected: string }>
}

interface DsaFile {
  company: string
  questions: DsaQuestion[]
}

async function seedDsa() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Check your root .env file.')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  console.log('Seeding DSA question bank...\n')

  const dsaDir = join(__dirname, 'dsa')
  const files = readdirSync(dsaDir).filter((f) => f.endsWith('.json'))

  let totalSeeded = 0

  for (const file of files) {
    const raw = readFileSync(join(dsaDir, file), 'utf-8')
    const dsaFile: DsaFile = JSON.parse(raw)

    console.log(`  ${dsaFile.company} (${dsaFile.questions.length} questions)`)

    for (const q of dsaFile.questions) {
      await db.insert(dsaQuestionBank).values({
        id: `dsa_${createId()}`,
        company: dsaFile.company,
        title: q.title,
        content: q.content,
        difficulty: q.difficulty,
        topic: q.topic,
        starterCode: q.starterCode,
        testCases: q.testCases,
      })

      console.log(`    - ${q.title} (${q.difficulty}, ${q.topic})`)
      totalSeeded++
    }
  }

  console.log(`\nSeeded ${totalSeeded} DSA questions from ${files.length} companies.`)
}

seedDsa().catch((err) => {
  console.error('DSA seed failed:', err)
  process.exit(1)
})
