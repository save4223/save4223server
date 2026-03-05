/**
 * Embedding Service
 * Generates and manages embeddings for item types
 */

import { db } from '../db'
import { itemTypes } from '../db/schema'
import { getLLMProvider } from '../lib/llm'
import { isNull, isNotNull, sql } from 'drizzle-orm'

export interface EmbeddingProgress {
  total: number
  processed: number
  failed: number
  errors: Array<{ id: number; name: string; error: string }>
}

/**
 * Generate a text representation of an item type for embedding
 */
function buildEmbeddingText(item: {
  name: string
  description: string | null
  category: string | null
}): string {
  const parts = [item.name]

  if (item.category) {
    parts.push(`Category: ${item.category}`)
  }

  if (item.description) {
    parts.push(item.description)
  }

  return parts.join('. ')
}

/**
 * Generate embedding for a single item type
 */
export async function generateEmbeddingForItemType(id: number): Promise<number[]> {
  const item = await db.query.itemTypes.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  })

  if (!item) {
    throw new Error(`Item type with id ${id} not found`)
  }

  const text = buildEmbeddingText(item)
  const provider = getLLMProvider()
  const result = await provider.generateEmbedding(text)

  return result.embedding
}

/**
 * Update embedding for a single item type
 */
export async function updateEmbeddingForItemType(id: number): Promise<void> {
  const embedding = await generateEmbeddingForItemType(id)

  // Convert array to PostgreSQL vector format
  const vectorStr = `[${embedding.join(',')}]`

  await db
    .update(itemTypes)
    .set({
      embedding: sql`'${vectorStr}'::vector`,
    } as never)
    .where(sql`id = ${id}`)
}

/**
 * Generate embeddings for all item types that don't have embeddings
 */
export async function generateMissingEmbeddings(
  onProgress?: (progress: EmbeddingProgress) => void
): Promise<EmbeddingProgress> {
  const progress: EmbeddingProgress = {
    total: 0,
    processed: 0,
    failed: 0,
    errors: [],
  }

  // Get all item types without embeddings
  const itemsWithoutEmbeddings = await db
    .select()
    .from(itemTypes)
    .where(isNull(itemTypes.embedding))

  progress.total = itemsWithoutEmbeddings.length

  if (progress.total === 0) {
    return progress
  }

  const provider = getLLMProvider()

  for (const item of itemsWithoutEmbeddings) {
    try {
      const text = buildEmbeddingText(item)
      const result = await provider.generateEmbedding(text)

      // Convert array to PostgreSQL vector format
      const vectorStr = `[${result.embedding.join(',')}]`

      await db
        .update(itemTypes)
        .set({
          embedding: sql`'${vectorStr}'::vector`,
        } as never)
        .where(sql`id = ${item.id}`)

      progress.processed++
    } catch (error) {
      progress.failed++
      progress.errors.push({
        id: item.id,
        name: item.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    onProgress?.(progress)
  }

  return progress
}

/**
 * Regenerate embeddings for all item types
 */
export async function regenerateAllEmbeddings(
  onProgress?: (progress: EmbeddingProgress) => void
): Promise<EmbeddingProgress> {
  const progress: EmbeddingProgress = {
    total: 0,
    processed: 0,
    failed: 0,
    errors: [],
  }

  // Get all item types
  const allItems = await db.select().from(itemTypes)

  progress.total = allItems.length

  if (progress.total === 0) {
    return progress
  }

  const provider = getLLMProvider()

  for (const item of allItems) {
    try {
      const text = buildEmbeddingText(item)
      const result = await provider.generateEmbedding(text)

      // Convert array to PostgreSQL vector format
      const vectorStr = `[${result.embedding.join(',')}]`

      await db
        .update(itemTypes)
        .set({
          embedding: sql`'${vectorStr}'::vector`,
        } as never)
        .where(sql`id = ${item.id}`)

      progress.processed++
    } catch (error) {
      progress.failed++
      progress.errors.push({
        id: item.id,
        name: item.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    onProgress?.(progress)
  }

  return progress
}

/**
 * Get count of items with/without embeddings
 */
export async function getEmbeddingStats(): Promise<{
  total: number
  withEmbeddings: number
  withoutEmbeddings: number
}> {
  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(itemTypes)

  const [withEmbeddingsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemTypes)
    .where(isNotNull(itemTypes.embedding))

  return {
    total: Number(totalResult.count),
    withEmbeddings: Number(withEmbeddingsResult.count),
    withoutEmbeddings: Number(totalResult.count) - Number(withEmbeddingsResult.count),
  }
}
