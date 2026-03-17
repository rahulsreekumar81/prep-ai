import { db } from '@prepai/db'
import { companyData } from '@prepai/db/schema'
import { sql } from 'drizzle-orm'
import { generateEmbedding } from '../lib/ai-client'

interface CompanyContextResult {
  content: string
  company: string
  role: string
  similarity: number
}

export async function getCompanyContext(
  company: string,
  role: string,
): Promise<CompanyContextResult[]> {
  const queryText = `${company} ${role} interview questions patterns`
  const embedding = await generateEmbedding(queryText)

  // pgvector cosine similarity search
  const results = await db.execute(sql`
    SELECT content, company, role,
           1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM company_data
    WHERE company ILIKE ${`%${company}%`}
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT 5
  `)

  return results.rows as CompanyContextResult[]
}
