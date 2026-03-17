import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { createId } from '@paralleldrive/cuid2'
import { companyData } from '../schema/index'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Check your root .env file.')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  console.log('Seeding company data...\n')

  const companiesDir = join(__dirname, 'companies')
  const files = readdirSync(companiesDir).filter((f) => f.endsWith('.json'))

  let totalSeeded = 0

  for (const file of files) {
    const raw = readFileSync(join(companiesDir, file), 'utf-8')
    const companyFile = JSON.parse(raw)

    console.log(`  ${companyFile.company}`)

    for (const entry of companyFile.data) {
      await db.insert(companyData).values({
        id: `cd_${createId()}`,
        company: companyFile.company,
        role: entry.role,
        content: entry.content,
      })

      console.log(`    - ${entry.role}`)
      totalSeeded++
    }
  }

  console.log(`\nSeeded ${totalSeeded} company records from ${files.length} files.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
