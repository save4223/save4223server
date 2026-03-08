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
 * Validates and sanitizes embedding array to prevent SQL injection
 * @param embedding Array of numbers from LLM provider
 * @returns Validated array of numbers
 * @throws Error if embedding contains invalid data
 */
function validateEmbedding(embedding: number[]): number[] {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array')
  }

  // Expected dimensions based on schema (1024 for current schema)
  const expectedDimensions = 1024
  if (embedding.length !== expectedDimensions) {
    throw new Error(`Embedding must have exactly ${expectedDimensions} dimensions, got ${embedding.length}`)
  }

  // Validate each value is a finite number
  for (let i = 0; i < embedding.length; i++) {
    const val = embedding[i]
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Embedding[${i}] is not a valid number: ${val}`)
    }
  }

  return embedding
}

/**
 * Convert validated embedding array to PostgreSQL vector string
 * This is safe to use with sql.raw() because values are validated
 */
function embeddingToVectorString(embedding: number[]): string {
  // Validate first, then format
  const validated = validateEmbedding(embedding)
  // Format as PostgreSQL vector: [0.1,0.2,0.3,...]
  return `[${validated.join(',')}]`
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

  // Validate and convert to vector string (safe for SQL)
  const queryVector = embeddingToVectorString(embeddingResult.embedding)

  // Perform vector similarity search using cosine distance
  // Uses CTE to calculate distance once, then reuse for filter, select, and order
  // This avoids redundant distance calculations (optimization)
  const results = await db.execute(sql`
    WITH scored_items AS (
      SELECT
        id,
        name,
        description,
        category,
        image_url,
        1 - (embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) as similarity
      FROM item_types
      WHERE embedding IS NOT NULL
    )
    SELECT *
    FROM scored_items
    WHERE similarity >= ${threshold}
    ORDER BY similarity DESC
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
