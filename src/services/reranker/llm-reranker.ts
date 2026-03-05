/**
 * LLM Reranker
 * Uses LLM to rerank candidates based on relevance to the query
 */

import { getLLMProvider } from '../../lib/llm'
import type { RerankCandidate, RerankResult } from '../../lib/llm/types'

export interface LLMRerankInput {
  id: number
  name: string
  description: string | null
  category: string | null
}

/**
 * Convert item type data to rerank candidates
 */
export function toRerankCandidates(items: LLMRerankInput[]): RerankCandidate[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
  }))
}

/**
 * Rerank candidates using LLM
 * Returns scores normalized to 0-1
 */
export async function llmRerank(
  query: string,
  candidates: RerankCandidate[]
): Promise<Map<number | string, { score: number; reason: string }>> {
  if (candidates.length === 0) {
    return new Map()
  }

  const provider = getLLMProvider()
  const results = await provider.rerank(query, candidates)

  const map = new Map<number | string, { score: number; reason: string }>()

  for (const result of results) {
    // Normalize score from 0-100 to 0-1
    map.set(result.id, {
      score: result.score / 100,
      reason: result.reason,
    })
  }

  // Set default scores for candidates not in results
  for (const candidate of candidates) {
    if (!map.has(candidate.id)) {
      map.set(candidate.id, {
        score: 0.5, // Neutral score
        reason: 'Not evaluated by LLM',
      })
    }
  }

  return map
}

/**
 * Batch rerank with chunking for large candidate sets
 * LLMs have context limits, so we chunk candidates into groups
 */
export async function batchLLMRerank(
  query: string,
  candidates: RerankCandidate[],
  chunkSize: number = 10
): Promise<Map<number | string, { score: number; reason: string }>> {
  if (candidates.length === 0) {
    return new Map()
  }

  // If candidates fit in one chunk, use simple rerank
  if (candidates.length <= chunkSize) {
    return llmRerank(query, candidates)
  }

  // Split into chunks and rerank each
  const allResults = new Map<number | string, { score: number; reason: string }>()
  const chunks: RerankCandidate[][] = []

  for (let i = 0; i < candidates.length; i += chunkSize) {
    chunks.push(candidates.slice(i, i + chunkSize))
  }

  // Process chunks in parallel
  const results = await Promise.all(chunks.map((chunk) => llmRerank(query, chunk)))

  // Merge results
  for (const resultMap of results) {
    for (const [id, data] of resultMap) {
      allResults.set(id, data)
    }
  }

  return allResults
}
