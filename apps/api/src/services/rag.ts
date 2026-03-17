import { ilike } from 'drizzle-orm'
import { getDb } from '@prepai/db'
import { companyData } from '@prepai/db/schema'

interface CompanyContextResult {
  content: string
  company: string
  role: string
}

/**
 * Get company-specific interview context.
 *
 * MVP: Uses simple text matching on company name.
 * Future: Switch to pgvector cosine similarity when embeddings are set up.
 */
export async function getCompanyContext(
  company: string,
  role: string,
): Promise<CompanyContextResult[]> {
  const db = getDb()

  try {
    const results = await db
      .select({
        content: companyData.content,
        company: companyData.company,
        role: companyData.role,
      })
      .from(companyData)
      .where(ilike(companyData.company, `%${company}%`))
      .limit(5)

    // Prioritize matching roles if available
    if (role && results.length > 1) {
      const roleMatches = results.filter(
        (r) =>
          r.role.toLowerCase().includes(role.toLowerCase()) ||
          role.toLowerCase().includes(r.role.toLowerCase()),
      )
      if (roleMatches.length > 0) return roleMatches
    }

    return results
  } catch (err) {
    console.warn('RAG query failed:', err)
    return []
  }
}
