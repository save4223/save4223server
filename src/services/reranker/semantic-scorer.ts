/**
 * Semantic Scorer
 * Performs vector similarity search using pgvector
 */

import { db } from '../../db'
import { itemTypes, items } from '../../db/schema'
import { getLLMProvider } from '../../lib/llm'
import { sql, eq, inArray } from 'drizzle-orm'

export interface SemanticSearchResult {
  id: number
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  similarity: number
}

/**
 * Perform vector similarity search
 * @param query The user's project description
 * @param limit Maximum number of results to return
 * @param threshold Minimum similarity threshold (0-1)
 */
export async function semanticSearch(
  query: string,
  limit: number = 50,
  threshold: number = 0.5
): Promise<SemanticSearchResult[]> {
  // Generate embedding for the query
  const provider = getLLMProvider()
  const embeddingResult = await provider.generateEmbedding(query)
  const queryVector = `[${embeddingResult.embedding.join(',')}]`

  // Perform vector similarity search using cosine distance
  // cosine distance = 1 - cosine similarity
  const results = await db.execute(sql`
    SELECT
      id,
      name,
      description,
      category,
      image_url,
      1 - (embedding <=> '${sql.raw(queryVector)}'::vector) as similarity
    FROM item_types
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> '${sql.raw(queryVector)}'::vector) >= ${threshold}
    ORDER BY embedding <=> '${sql.raw(queryVector)}'::vector
    LIMIT ${limit}
  `)

  return results.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    imageUrl: row.image_url as string | null,
    similarity: row.similarity as number,
  }))
}

/**
 * Calculate semantic similarity score (normalized to 0-1)
 */
export function calculateSemanticScore(similarity: number): number {
  // Similarity is already 0-1 from cosine similarity
  return Math.max(0, Math.min(1, similarity))
}
