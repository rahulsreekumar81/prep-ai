import { getDb } from '../index.js'
import { companyPipelines, pipelineRounds } from '../schema/index.js'
import { createId } from '@paralleldrive/cuid2'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface RoundDef {
  name: string
  roundType: 'oa' | 'phone_screen' | 'coding' | 'system_design' | 'behavioral' | 'mixed'
  orderIndex: number
  durationMinutes: number
  questionCount: number
  passingScore: number
  description: string
}

interface PipelineDef {
  company: string
  role: string
  description: string
  passingThreshold: number
  rounds: RoundDef[]
}

async function seedPipelines() {
  const db = getDb()

  const pipelineFiles = ['google.json']

  for (const file of pipelineFiles) {
    const raw = readFileSync(join(__dirname, 'pipelines', file), 'utf-8')
    const def: PipelineDef = JSON.parse(raw)

    console.log(`Seeding pipeline: ${def.company} — ${def.role}`)

    const pipelineId = createId()

    await db
      .insert(companyPipelines)
      .values({
        id: pipelineId,
        company: def.company,
        role: def.role,
        description: def.description,
        totalRounds: def.rounds.length,
        passingThreshold: def.passingThreshold,
      })
      .onConflictDoNothing()

    const roundValues = def.rounds.map((r) => ({
      id: createId(),
      pipelineId,
      name: r.name,
      roundType: r.roundType,
      orderIndex: r.orderIndex,
      durationMinutes: r.durationMinutes,
      questionCount: r.questionCount,
      passingScore: r.passingScore,
      description: r.description,
    }))

    await db.insert(pipelineRounds).values(roundValues).onConflictDoNothing()

    console.log(`  ✓ ${def.rounds.length} rounds seeded`)
  }

  console.log('Pipeline seeding complete.')
  process.exit(0)
}

seedPipelines().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
