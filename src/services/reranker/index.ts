/**
 * Reranker Orchestrator
 * Coordinates all scoring components and produces final rankings
 */

import { semanticSearch, calculateSemanticScore, type SemanticSearchResult } from './semantic-scorer'
import {
  getAvailabilityInfo,
  calculateAvailabilityScore,
  type AvailabilityInfo,
} from './availability-scorer'
import {
  getPopularityInfo,
  normalizePopularityScores,
  type PopularityInfo,
} from './popularity-scorer'
import { batchLLMRerank, toRerankCandidates } from './llm-reranker'
import {
  createRankedItems,
  sortByScore,
  type RerankWeights,
  type RankedItem,
  type ScoreComponents,
  DEFAULT_WEIGHTS,
} from './weighted-fusion'

export * from './semantic-scorer'
export * from './availability-scorer'
export * from './popularity-scorer'
export * from './llm-reranker'
export * from './weighted-fusion'

export interface RerankOptions {
  /** Maximum candidates to retrieve from vector search */
  retrievalLimit?: number
  /** Minimum similarity threshold for retrieval */
  similarityThreshold?: number
  /** Maximum candidates to send to LLM for reranking */
  llmCandidateLimit?: number
  /** Final number of items to return */
  topK?: number
  /** Custom weights for scoring fusion */
  weights?: Partial<RerankWeights>
  /** Whether to skip LLM reranking (faster but less accurate) */
  skipLLMRerank?: boolean
}

export const DEFAULT_OPTIONS: Required<Omit<RerankOptions, 'weights'>> & { weights: RerankWeights } = {
  retrievalLimit: 50,
  similarityThreshold: 0.3,
  llmCandidateLimit: 20,
  topK: 5,
  weights: DEFAULT_WEIGHTS,
  skipLLMRerank: false,
}

/**
 * Full reranking pipeline
 */
export async function rerank(
  query: string,
  options: RerankOptions = {}
): Promise<RankedItem[]> {
  const weights: RerankWeights = { ...DEFAULT_WEIGHTS, ...options.weights }
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights,
  }

  // Step 1: Semantic search (vector retrieval)
  const searchResults = await semanticSearch(query, opts.retrievalLimit, opts.similarityThreshold)

  if (searchResults.length === 0) {
    return []
  }

  const itemTypeIds = searchResults.map((r) => r.id)

  // Step 2: Get availability info
  const availabilityMap = await getAvailabilityInfo(itemTypeIds)

  // Step 3: Get popularity info and normalize
  const popularityMap = await getPopularityInfo(itemTypeIds)
  const popularityScores = normalizePopularityScores(itemTypeIds, popularityMap)

  // Step 4: LLM reranking (optional)
  let llmScores = new Map<number | string, { score: number; reason: string }>()

  if (!opts.skipLLMRerank) {
    // Take top N candidates for LLM reranking
    const topCandidates = searchResults.slice(0, opts.llmCandidateLimit)
    const rerankCandidates = toRerankCandidates(topCandidates)
    llmScores = await batchLLMRerank(query, rerankCandidates, 10)
  }

  // Step 5: Build score components for each item
  const scoresMap = new Map<number, ScoreComponents>()

  for (const item of searchResults) {
    const availabilityInfo = availabilityMap.get(item.id)
    const llmResult = llmScores.get(item.id)

    scoresMap.set(item.id, {
      semantic: calculateSemanticScore(item.similarity),
      availability: availabilityInfo ? calculateAvailabilityScore(availabilityInfo) : 0,
      category: 0.5, // Reserved for future category relevance scoring
      popularity: popularityScores.get(item.id) || 0,
      llm: llmResult?.score ?? (opts.skipLLMRerank ? 0.5 : 0),
    })
  }

  // Step 6: Create ranked items and sort
  const rankedItems = createRankedItems(searchResults, scoresMap, opts.weights)

  return sortByScore(rankedItems).slice(0, opts.topK)
}

/**
 * Rerank with explanation
 * Returns ranked items with detailed scoring breakdown
 */
export async function rerankWithExplanation(
  query: string,
  options: RerankOptions = {}
): Promise<{
  items: RankedItem[]
  query: string
  options: Required<Omit<RerankOptions, 'weights'>> & { weights: RerankWeights }
}> {
  const items = await rerank(query, options)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  if (options.weights) {
    opts.weights = { ...DEFAULT_WEIGHTS, ...options.weights }
  }

  return {
    items,
    query,
    options: opts as Required<Omit<RerankOptions, 'weights'>> & { weights: RerankWeights },
  }
}
