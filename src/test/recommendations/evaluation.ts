/**
 * Evaluation Metrics for Recommendation Engine
 * Implements standard IR metrics: Precision@K, Recall@K, MRR, NDCG
 */

export interface EvaluationResult {
  testCaseId: string
  precisionAt1: number
  precisionAt3: number
  precisionAt5: number
  recallAt5: number
  mrr: number // Mean Reciprocal Rank
  ndcgAt5: number // Normalized Discounted Cumulative Gain
  recommendedTools: string[]
  expectedTools: string[]
  relevantTools: string[]
}

export interface AggregateMetrics {
  avgPrecisionAt1: number
  avgPrecisionAt3: number
  avgPrecisionAt5: number
  avgRecallAt5: number
  avgMrr: number
  avgNdcgAt5: number
  totalTests: number
  successfulTests: number
  failedTests: number
  latencyMs: number
}

/**
 * Calculate Precision@K
 * Fraction of recommended items in top K that are relevant
 */
export function precisionAtK(
  recommended: string[],
  relevant: string[], // includes both expected and relevant
  k: number
): number {
  if (recommended.length === 0 || k === 0) return 0

  const topK = recommended.slice(0, k)
  const relevantSet = new Set(relevant.map((r) => r.toLowerCase()))

  const hits = topK.filter((item) => relevantSet.has(item.toLowerCase())).length
  return hits / k
}

/**
 * Calculate Recall@K
 * Fraction of relevant items that appear in top K recommendations
 */
export function recallAtK(
  recommended: string[],
  relevant: string[],
  k: number
): number {
  if (relevant.length === 0) return 1 // Nothing to recall
  if (recommended.length === 0) return 0

  const topK = recommended.slice(0, k)
  const relevantSet = new Set(relevant.map((r) => r.toLowerCase()))
  const topKSet = new Set(topK.map((r) => r.toLowerCase()))

  let hits = 0
  for (const item of relevantSet) {
    if (topKSet.has(item)) hits++
  }

  return hits / relevant.length
}

/**
 * Calculate Mean Reciprocal Rank (MRR)
 * The reciprocal of the rank of the first relevant item
 */
export function meanReciprocalRank(
  recommended: string[],
  relevant: string[]
): number {
  if (recommended.length === 0 || relevant.length === 0) return 0

  const relevantSet = new Set(relevant.map((r) => r.toLowerCase()))

  for (let i = 0; i < recommended.length; i++) {
    if (relevantSet.has(recommended[i].toLowerCase())) {
      return 1 / (i + 1)
    }
  }

  return 0
}

/**
 * Calculate Normalized Discounted Cumulative Gain (NDCG@K)
 * Measures ranking quality with graded relevance
 */
export function ndcgAtK(
  recommended: string[],
  expected: string[], // Higher relevance (score 2)
  relevant: string[], // Lower relevance (score 1)
  k: number
): number {
  if (recommended.length === 0) return 0

  const expectedSet = new Set(expected.map((r) => r.toLowerCase()))
  const relevantSet = new Set(relevant.map((r) => r.toLowerCase()))

  // Calculate DCG@K
  let dcg = 0
  const topK = recommended.slice(0, k)

  for (let i = 0; i < topK.length; i++) {
    const item = topK[i].toLowerCase()
    let relevance = 0

    if (expectedSet.has(item)) {
      relevance = 2 // Expected items have higher relevance
    } else if (relevantSet.has(item)) {
      relevance = 1 // Relevant items have lower relevance
    }

    // DCG formula: rel / log2(rank + 1)
    dcg += relevance / Math.log2(i + 2)
  }

  // Calculate IDCG@K (ideal DCG)
  const idealRelevance: number[] = [
    ...Array(expectedSet.size).fill(2),
    ...Array(relevantSet.size).fill(1),
  ].slice(0, k)

  let idcg = 0
  for (let i = 0; i < idealRelevance.length; i++) {
    idcg += idealRelevance[i] / Math.log2(i + 2)
  }

  if (idcg === 0) return 0
  return dcg / idcg
}

/**
 * Evaluate a single recommendation result
 */
export function evaluateSingle(
  testCase: {
    id: string
    expectedTools: string[]
    relevantTools: string[]
  },
  recommendedTools: string[]
): EvaluationResult {
  const allRelevant = [...testCase.expectedTools, ...testCase.relevantTools]

  return {
    testCaseId: testCase.id,
    precisionAt1: precisionAtK(recommendedTools, allRelevant, 1),
    precisionAt3: precisionAtK(recommendedTools, allRelevant, 3),
    precisionAt5: precisionAtK(recommendedTools, allRelevant, 5),
    recallAt5: recallAtK(recommendedTools, allRelevant, 5),
    mrr: meanReciprocalRank(recommendedTools, allRelevant),
    ndcgAt5: ndcgAtK(recommendedTools, testCase.expectedTools, testCase.relevantTools, 5),
    recommendedTools,
    expectedTools: testCase.expectedTools,
    relevantTools: testCase.relevantTools,
  }
}

/**
 * Calculate aggregate metrics from multiple evaluation results
 */
export function calculateAggregateMetrics(
  results: EvaluationResult[],
  latencyMs: number
): AggregateMetrics {
  if (results.length === 0) {
    return {
      avgPrecisionAt1: 0,
      avgPrecisionAt3: 0,
      avgPrecisionAt5: 0,
      avgRecallAt5: 0,
      avgMrr: 0,
      avgNdcgAt5: 0,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      latencyMs: 0,
    }
  }

  const sum = results.reduce(
    (acc, r) => ({
      precisionAt1: acc.precisionAt1 + r.precisionAt1,
      precisionAt3: acc.precisionAt3 + r.precisionAt3,
      precisionAt5: acc.precisionAt5 + r.precisionAt5,
      recallAt5: acc.recallAt5 + r.recallAt5,
      mrr: acc.mrr + r.mrr,
      ndcgAt5: acc.ndcgAt5 + r.ndcgAt5,
    }),
    { precisionAt1: 0, precisionAt3: 0, precisionAt5: 0, recallAt5: 0, mrr: 0, ndcgAt5: 0 }
  )

  const count = results.length

  return {
    avgPrecisionAt1: sum.precisionAt1 / count,
    avgPrecisionAt3: sum.precisionAt3 / count,
    avgPrecisionAt5: sum.precisionAt5 / count,
    avgRecallAt5: sum.recallAt5 / count,
    avgMrr: sum.mrr / count,
    avgNdcgAt5: sum.ndcgAt5 / count,
    totalTests: count,
    successfulTests: results.filter((r) => r.precisionAt5 > 0.5).length,
    failedTests: results.filter((r) => r.precisionAt5 === 0).length,
    latencyMs,
  }
}

/**
 * Format metrics for display
 */
export function formatMetricsReport(metrics: AggregateMetrics): string {
  return `
=== Recommendation Engine Evaluation Report ===

Performance Metrics:
  Precision@1:  ${(metrics.avgPrecisionAt1 * 100).toFixed(1)}%
  Precision@3:  ${(metrics.avgPrecisionAt3 * 100).toFixed(1)}%
  Precision@5:  ${(metrics.avgPrecisionAt5 * 100).toFixed(1)}%
  Recall@5:     ${(metrics.avgRecallAt5 * 100).toFixed(1)}%
  MRR:          ${(metrics.avgMrr * 100).toFixed(1)}%
  NDCG@5:       ${(metrics.avgNdcgAt5 * 100).toFixed(1)}%

Test Summary:
  Total Tests:      ${metrics.totalTests}
  Successful (P@5>0.5): ${metrics.successfulTests} (${((metrics.successfulTests / metrics.totalTests) * 100).toFixed(1)}%)
  Failed (P@5=0):   ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)

Latency:
  Average: ${(metrics.latencyMs / metrics.totalTests).toFixed(0)}ms per query
`.trim()
}
