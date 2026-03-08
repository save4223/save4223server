/**
 * Reranker Orchestrator
 * Coordinates all scoring components and produces final rankings
 */

import { semanticSearch, calculateSemanticScore, type SemanticSearchResult } from './semantic-scorer'
import { hybridSearch, type HybridSearchResult, type HybridSearchOptions } from './hybrid-scorer'
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
export * from './hybrid-scorer'

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

export interface HybridRerankOptions extends RerankOptions {
  /** Use hybrid search instead of pure semantic search */
  useHybridSearch?: boolean
  /** Hybrid search configuration */
  hybridOptions?: Partial<HybridSearchOptions>
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
  options: HybridRerankOptions = {}
): Promise<RankedItem[]> {
  const weights: RerankWeights = { ...DEFAULT_WEIGHTS, ...options.weights }
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights,
  }

  // Step 1: Retrieval (semantic or hybrid)
  let searchResults: SemanticSearchResult[]

  if (opts.useHybridSearch) {
    // Use hybrid search combining semantic + keyword
    const hybridResults = await hybridSearch(query, {
      limit: opts.retrievalLimit,
      semanticThreshold: opts.similarityThreshold,
      ...opts.hybridOptions,
    })
    // Convert hybrid results to semantic search result format
    searchResults = hybridResults.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      category: h.category,
      imageUrl: h.imageUrl,
      similarity: h.hybridScore, // Use the combined hybrid score
    }))
  } else {
    // Pure semantic search
    searchResults = await semanticSearch(query, opts.retrievalLimit, opts.similarityThreshold)
  }

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
 * Hybrid reranking pipeline with detailed hybrid scores
 */
export async function hybridRerank(
  query: string,
  options: Omit<HybridRerankOptions, 'useHybridSearch'> = {}
): Promise<
  Array<
    RankedItem & {
      semanticScore: number
      keywordScore: number
    }
  >
> {
  const weights: RerankWeights = { ...DEFAULT_WEIGHTS, ...options.weights }
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    weights,
  }

  // Step 1: Hybrid search
  const hybridResults = await hybridSearch(query, {
    limit: opts.retrievalLimit,
    semanticThreshold: opts.similarityThreshold,
    ...opts.hybridOptions,
  })

  if (hybridResults.length === 0) {
    return []
  }

  const itemTypeIds = hybridResults.map((r) => r.id)
  const hybridScoreMap = new Map(hybridResults.map((r) => [r.id, r]))

  // Step 2: Get availability info
  const availabilityMap = await getAvailabilityInfo(itemTypeIds)

  // Step 3: Get popularity info and normalize
  const popularityMap = await getPopularityInfo(itemTypeIds)
  const popularityScores = normalizePopularityScores(itemTypeIds, popularityMap)

  // Step 4: LLM reranking (optional)
  let llmScores = new Map<number | string, { score: number; reason: string }>()

  if (!opts.skipLLMRerank) {
    const rerankCandidates = hybridResults.slice(0, opts.llmCandidateLimit).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      category: h.category,
    }))
    llmScores = await batchLLMRerank(query, rerankCandidates, 10)
  }

  // Step 5: Build score components
  const scoresMap = new Map<number, ScoreComponents>()

  for (const item of hybridResults) {
    const availabilityInfo = availabilityMap.get(item.id)
    const llmResult = llmScores.get(item.id)

    scoresMap.set(item.id, {
      semantic: item.semanticScore, // Use actual semantic component
      availability: availabilityInfo ? calculateAvailabilityScore(availabilityInfo) : 0,
      category: 0.5,
      popularity: popularityScores.get(item.id) || 0,
      llm: llmResult?.score ?? (opts.skipLLMRerank ? 0.5 : 0),
    })
  }

  // Step 6: Create ranked items and sort
  const rankedItems = createRankedItems(
    hybridResults.map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      category: h.category,
      imageUrl: h.imageUrl,
      similarity: h.hybridScore,
    })),
    scoresMap,
    opts.weights
  )

  const sorted = sortByScore(rankedItems).slice(0, opts.topK)

  // Add hybrid score breakdown
  return sorted.map((item) => {
    const hybridInfo = hybridScoreMap.get(item.id)
    return {
      ...item,
      semanticScore: hybridInfo?.semanticScore ?? 0,
      keywordScore: hybridInfo?.keywordScore ?? 0,
    }
  })
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
