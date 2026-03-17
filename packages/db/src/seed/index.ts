import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function seed() {
  console.log('Seeding company data...')

  const companiesDir = join(__dirname, 'companies')
  const files = readdirSync(companiesDir).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    const raw = readFileSync(join(companiesDir, file), 'utf-8')
    const companyFile = JSON.parse(raw)

    console.log(`  Seeding ${companyFile.company}...`)

    for (const entry of companyFile.data) {
      // TODO: Generate embedding and insert into company_data table
      // const embedding = await generateEmbedding(entry.content)
      // await db.insert(companyData).values({
      //   id: generateId('cd'),
      //   company: companyFile.company,
      //   role: entry.role,
      //   content: entry.content,
      //   embedding,
      // })

      console.log(`    - ${entry.role}`)
    }
  }

  console.log('Seeding complete!')
}

seed().catch(console.error)
