/**
 * Weighted Fusion Reranker
 * Combines multiple scoring signals into a final ranking
 */

export interface RerankWeights {
  semantic: number // Default: 0.25
  availability: number // Default: 0.20
  category: number // Default: 0.15 (reserved for future use)
  popularity: number // Default: 0.10
  llm: number // Default: 0.30
}

export const DEFAULT_WEIGHTS: RerankWeights = {
  semantic: 0.25,
  availability: 0.20,
  category: 0.15,
  popularity: 0.10,
  llm: 0.30,
}

export interface ScoreComponents {
  semantic: number
  availability: number
  category: number
  popularity: number
  llm: number
  llmReason?: string
}

export interface RankedItem {
  id: number
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  finalScore: number
  scores: ScoreComponents
}

/**
 * Validate weights sum to 1.0
 */
export function validateWeights(weights: RerankWeights): boolean {
  const sum = weights.semantic + weights.availability + weights.category + weights.popularity + weights.llm
  return Math.abs(sum - 1.0) < 0.001
}

/**
 * Normalize weights to sum to 1.0
 */
export function normalizeWeights(weights: RerankWeights): RerankWeights {
  const sum = weights.semantic + weights.availability + weights.category + weights.popularity + weights.llm

  if (sum === 0) {
    return DEFAULT_WEIGHTS
  }

  return {
    semantic: weights.semantic / sum,
    availability: weights.availability / sum,
    category: weights.category / sum,
    popularity: weights.popularity / sum,
    llm: weights.llm / sum,
  }
}

/**
 * Calculate weighted fusion score
 */
export function calculateWeightedScore(scores: ScoreComponents, weights: RerankWeights): number {
  return (
    scores.semantic * weights.semantic +
    scores.availability * weights.availability +
    scores.category * weights.category +
    scores.popularity * weights.popularity +
    scores.llm * weights.llm
  )
}

/**
 * Sort items by final score (descending)
 */
export function sortByScore(items: RankedItem[]): RankedItem[] {
  return [...items].sort((a, b) => b.finalScore - a.finalScore)
}

/**
 * Get top K items from ranked list
 */
export function getTopK(items: RankedItem[], k: number): RankedItem[] {
  return sortByScore(items).slice(0, k)
}

/**
 * Create ranked items from scoring components
 */
export function createRankedItems(
  itemData: Array<{
    id: number
    name: string
    description: string | null
    category: string | null
    imageUrl: string | null
  }>,
  scoresMap: Map<number, ScoreComponents>,
  weights: RerankWeights = DEFAULT_WEIGHTS
): RankedItem[] {
  return itemData.map((item) => {
    const scores = scoresMap.get(item.id) || {
      semantic: 0,
      availability: 0,
      category: 0,
      popularity: 0,
      llm: 0,
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      finalScore: calculateWeightedScore(scores, weights),
      scores,
    }
  })
}
