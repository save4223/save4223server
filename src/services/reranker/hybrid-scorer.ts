/**
 * Hybrid Scorer
 * Combines dense vector (semantic) search with sparse vector (keyword) search
 * for improved accuracy on both conceptual and exact-match queries
 */

import { db } from '../../db'
import { itemTypes } from '../../db/schema'
import { getLLMProvider } from '../../lib/llm'
import { sql } from 'drizzle-orm'

export interface HybridSearchResult {
  id: number
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  semanticScore: number
  keywordScore: number
  hybridScore: number
}

export interface HybridSearchOptions {
  /** Maximum results to return */
  limit?: number
  /** Minimum semantic similarity threshold (0-1) */
  semanticThreshold?: number
  /** Minimum keyword score threshold (0-1) */
  keywordThreshold?: number
  /** Weight for semantic score (0-1), keyword gets (1 - semanticWeight) */
  semanticWeight?: number
  /** Enable reciprocal rank fusion instead of linear combination */
  useRRF?: boolean
  /** RRF constant k (typical: 20-60) */
  rrfK?: number
}

const DEFAULT_OPTIONS: Required<HybridSearchOptions> = {
  limit: 50,
  semanticThreshold: 0.3,
  keywordThreshold: 0.1,
  semanticWeight: 0.7,
  useRRF: true,
  rrfK: 60,
}

/**
 * Validates and sanitizes embedding array
 */
function validateEmbedding(embedding: number[]): number[] {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array')
  }

  const expectedDimensions = 1024
  if (embedding.length !== expectedDimensions) {
    throw new Error(`Embedding must have exactly ${expectedDimensions} dimensions, got ${embedding.length}`)
  }

  for (let i = 0; i < embedding.length; i++) {
    const val = embedding[i]
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Embedding[${i}] is not a valid number: ${val}`)
    }
  }

  return embedding
}

/**
 * Build a PostgreSQL tsquery from search terms
 * Supports:
 * - Plain text: "drill power" -> drill & power
 * - Phrases: "\"power drill\"" -> power <-> drill
 * - OR: "drill | driver" -> drill | driver
 * - NOT: "drill !hammer" -> drill & !hammer
 */
function buildTsQuery(query: string): string {
  // Normalize the query
  let normalized = query
    .toLowerCase()
    .trim()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')

  // Extract quoted phrases first
  const phrases: string[] = []
  const phraseRegex = /"([^"]+)"/g
  let match
  while ((match = phraseRegex.exec(normalized)) !== null) {
    phrases.push(match[1])
  }

  // Replace phrases with placeholders
  let placeholderIndex = 0
  normalized = normalized.replace(phraseRegex, () => `__PHRASE_${placeholderIndex++}__`)

  // Split by | for OR operations
  const orParts = normalized.split('|').map((part) => part.trim())

  const processedParts = orParts.map((part) => {
    // Handle NOT (!)
    const notParts = part.split('!').map((p) => p.trim())
    const positiveTerms = notParts[0]
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('__PHRASE_'))
    const negativeTerms = notParts
      .slice(1)
      .flatMap((p) => p.split(/\s+/))
      .filter((t) => t && !t.startsWith('__PHRASE_'))

    // Re-insert phrases
    const phraseTerms = phrases.map((p) => p.replace(/\s+/g, ' <-> '))

    // Combine all positive terms
    const allPositive = [...positiveTerms, ...phraseTerms]

    if (allPositive.length === 0) {
      return null
    }

    let tsQuery = allPositive.join(' & ')

    // Add negative terms
    if (negativeTerms.length > 0) {
      tsQuery += ' & !' + negativeTerms.join(' & !')
    }

    return tsQuery
  })

  const validParts = processedParts.filter((p): p is string => p !== null)

  if (validParts.length === 0) {
    // Fallback: use plainto_tsquery for simple queries
    return normalized.replace(/__PHRASE_\d+__/g, '').trim() || query
  }

  return validParts.join(' | ')
}

/**
 * Perform hybrid search combining dense vector and full-text search
 *
 * Algorithm options:
 * 1. Linear Combination (default): hybrid_score = w * semantic + (1-w) * keyword
 * 2. Reciprocal Rank Fusion (RRF): score = Σ 1/(k + rank) for each method
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Generate embedding for semantic search
  const provider = getLLMProvider()
  const embeddingResult = await provider.generateEmbedding(query)
  const queryVector = `[${validateEmbedding(embeddingResult.embedding).join(',')}]`

  // Build tsquery for keyword search
  const tsQuery = buildTsQuery(query)

  if (opts.useRRF) {
    return hybridSearchRRF(queryVector, tsQuery, opts)
  } else {
    return hybridSearchLinear(queryVector, tsQuery, opts)
  }
}

/**
 * Linear combination hybrid search
 * hybrid_score = semanticWeight * semantic_score + (1 - semanticWeight) * keyword_score
 */
async function hybridSearchLinear(
  queryVector: string,
  tsQuery: string,
  opts: Required<HybridSearchOptions>
): Promise<HybridSearchResult[]> {
  const keywordWeight = 1 - opts.semanticWeight

  const results = await db.execute(sql`
    WITH
    -- Semantic search results
    semantic_scores AS (
      SELECT
        id,
        name,
        description,
        category,
        image_url,
        1 - (embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) as semantic_score
      FROM item_types
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) >= ${opts.semanticThreshold}
    ),
    -- Keyword search results using full-text search
    keyword_scores AS (
      SELECT
        id,
        COALESCE(
          ts_rank_cd(
            to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')),
            to_tsquery('english', ${tsQuery}),
            32 /* rank normalization: divide by document length + 1 */
          ),
          0
        ) as keyword_score
      FROM item_types
      WHERE to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')) @@
            to_tsquery('english', ${tsQuery})
    ),
    -- Combined scores
    combined AS (
      SELECT
        s.id,
        s.name,
        s.description,
        s.category,
        s.image_url,
        s.semantic_score,
        COALESCE(k.keyword_score, 0) as keyword_score,
        (${opts.semanticWeight} * s.semantic_score +
         ${keywordWeight} * COALESCE(k.keyword_score, 0)) as hybrid_score
      FROM semantic_scores s
      LEFT JOIN keyword_scores k ON s.id = k.id
      UNION ALL
      -- Add keyword-only matches that didn't make semantic threshold
      SELECT
        it.id,
        it.name,
        it.description,
        it.category,
        it.image_url,
        0 as semantic_score,
        k.keyword_score,
        (${keywordWeight} * k.keyword_score) as hybrid_score
      FROM keyword_scores k
      JOIN item_types it ON it.id = k.id
      WHERE k.keyword_score >= ${opts.keywordThreshold}
        AND it.id NOT IN (SELECT id FROM semantic_scores)
    )
    SELECT *
    FROM combined
    WHERE hybrid_score > 0
    ORDER BY hybrid_score DESC
    LIMIT ${opts.limit}
  `)

  return results.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    imageUrl: row.image_url as string | null,
    semanticScore: row.semantic_score as number,
    keywordScore: row.keyword_score as number,
    hybridScore: row.hybrid_score as number,
  }))
}

/**
 * Reciprocal Rank Fusion hybrid search
 * RRF score = Σ 1/(k + rank) for each method
 * This tends to work better than linear combination because:
 * 1. It's less sensitive to absolute score differences
 * 2. Items ranked highly in either method get boosted
 * 3. The k parameter controls how much to value top ranks vs deep ranks
 */
async function hybridSearchRRF(
  queryVector: string,
  tsQuery: string,
  opts: Required<HybridSearchOptions>
): Promise<HybridSearchResult[]> {
  const results = await db.execute(sql`
    WITH
    -- Semantic search with ranks
    semantic_ranked AS (
      SELECT
        id,
        name,
        description,
        category,
        image_url,
        1 - (embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) as semantic_score,
        row_number() OVER (ORDER BY embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) as rank
      FROM item_types
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${sql.raw(`'${queryVector}'::vector`)}) >= ${opts.semanticThreshold}
      LIMIT ${opts.limit * 2}
    ),
    -- Keyword search with ranks
    keyword_ranked AS (
      SELECT
        id,
        ts_rank_cd(
          to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')),
          to_tsquery('english', ${tsQuery}),
          32
        ) as keyword_score,
        row_number() OVER (
          ORDER BY ts_rank_cd(
            to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')),
            to_tsquery('english', ${tsQuery}),
            32
          ) DESC
        ) as rank
      FROM item_types
      WHERE to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')) @@
            to_tsquery('english', ${tsQuery})
      LIMIT ${opts.limit * 2}
    ),
    -- RRF fusion
    rrf_scores AS (
      SELECT
        COALESCE(s.id, k.id) as id,
        MAX(s.name) as name,
        MAX(s.description) as description,
        MAX(s.category) as category,
        MAX(s.image_url) as image_url,
        MAX(s.semantic_score) as semantic_score,
        MAX(k.keyword_score) as keyword_score,
        COALESCE(1.0 / (${opts.rrfK} + MIN(s.rank)), 0) +
        COALESCE(1.0 / (${opts.rrfK} + MIN(k.rank)), 0) as rrf_score
      FROM semantic_ranked s
      FULL OUTER JOIN keyword_ranked k ON s.id = k.id
      GROUP BY COALESCE(s.id, k.id)
    )
    SELECT *
    FROM rrf_scores
    ORDER BY rrf_score DESC
    LIMIT ${opts.limit}
  `)

  return results.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    imageUrl: row.image_url as string | null,
    semanticScore: (row.semantic_score as number) || 0,
    keywordScore: (row.keyword_score as number) || 0,
    hybridScore: row.rrf_score as number,
  }))
}

/**
 * Preprocess query for better keyword matching
 * - Expands abbreviations
 * - Normalizes tool names
 * - Adds synonyms
 */
export function preprocessQuery(query: string): string {
  const expansions: Record<string, string> = {
    drill: 'drill driver',
    screwdriver: 'screw driver',
    pcb: 'printed circuit board',
    smd: 'surface mount device',
    thru: 'through hole',
    multimeter: 'multimeter dmm',
    scope: 'oscilloscope',
    iron: 'soldering iron',
    station: 'soldering station',
    hot: 'hot air rework',
    printer: '3d printer printing',
    cnc: 'cnc mill milling',
    laser: 'laser cutter cutting',
    bandsaw: 'band saw',
    tablesaw: 'table saw',
    jigsaw: 'jig saw',
    handsaw: 'hand saw',
  }

  let expanded = query.toLowerCase()

  for (const [term, expansion] of Object.entries(expansions)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    if (regex.test(expanded)) {
      expanded = expanded.replace(regex, `${term} ${expansion}`)
    }
  }

  return expanded
}
