/**
 * Test Runner for Recommendation Engine
 * Runs evaluation against test cases and generates reports
 */

import { testCases, type TestCase } from './test-cases'
import {
  evaluateSingle,
  calculateAggregateMetrics,
  formatMetricsReport,
  type EvaluationResult,
  type AggregateMetrics,
} from './evaluation'
import { rerank, type RerankOptions } from '@/services/reranker'
import { db } from '@/db'
import { itemTypes } from '@/db/schema'

export interface TestRunConfig {
  /** Filter by difficulty */
  difficulty?: TestCase['difficulty']
  /** Filter by category */
  category?: string
  /** Custom rerank options */
  rerankOptions?: Partial<RerankOptions>
  /** Verbose output */
  verbose?: boolean
}

export interface TestRunResult {
  config: TestRunConfig
  results: EvaluationResult[]
  aggregate: AggregateMetrics
  timestamp: string
  durationMs: number
}

/**
 * Get item type name by ID
 */
async function getItemTypeNameMap(): Promise<Map<number, string>> {
  const types = await db.select().from(itemTypes)
  return new Map(types.map((t) => [t.id, t.name]))
}

/**
 * Run a single test case
 */
async function runSingleTest(
  testCase: TestCase,
  itemNameMap: Map<number, string>,
  options: RerankOptions
): Promise<EvaluationResult> {
  const rankedItems = await rerank(testCase.query, options)

  // Map IDs back to names
  const recommendedNames = rankedItems.map((item) => itemNameMap.get(item.id) || `Unknown(${item.id})`)

  return evaluateSingle(testCase, recommendedNames)
}

/**
 * Run all tests or a filtered subset
 */
export async function runTests(config: TestRunConfig = {}): Promise<TestRunResult> {
  const startTime = Date.now()
  const rerankOptions: RerankOptions = {
    topK: 5,
    skipLLMRerank: config.rerankOptions?.skipLLMRerank ?? false,
    ...config.rerankOptions,
  }

  // Filter test cases
  let filteredCases = [...testCases]
  if (config.difficulty) {
    filteredCases = filteredCases.filter((tc) => tc.difficulty === config.difficulty)
  }
  if (config.category) {
    filteredCases = filteredCases.filter((tc) => tc.category === config.category)
  }

  // Get item name mapping
  const itemNameMap = await getItemTypeNameMap()

  // Run tests
  const results: EvaluationResult[] = []

  for (const testCase of filteredCases) {
    try {
      const result = await runSingleTest(testCase, itemNameMap, rerankOptions)
      results.push(result)

      if (config.verbose) {
        console.log(`\nTest: ${testCase.id}`)
        console.log(`Query: "${testCase.query}"`)
        console.log(`Precision@5: ${(result.precisionAt5 * 100).toFixed(0)}%`)
        console.log(`Recommended: ${result.recommendedTools.slice(0, 5).join(', ')}`)
        console.log(`Expected: ${result.expectedTools.join(', ')}`)
      }
    } catch (error) {
      console.error(`Test ${testCase.id} failed with error:`, error)
      // Add a failed result
      results.push({
        testCaseId: testCase.id,
        precisionAt1: 0,
        precisionAt3: 0,
        precisionAt5: 0,
        recallAt5: 0,
        mrr: 0,
        ndcgAt5: 0,
        recommendedTools: [],
        expectedTools: testCase.expectedTools,
        relevantTools: testCase.relevantTools,
      })
    }
  }

  const durationMs = Date.now() - startTime
  const aggregate = calculateAggregateMetrics(results, durationMs)

  return {
    config,
    results,
    aggregate,
    timestamp: new Date().toISOString(),
    durationMs,
  }
}

/**
 * Run tests and print a report
 */
export async function runAndReport(config: TestRunConfig = {}): Promise<TestRunResult> {
  console.log('Running Recommendation Engine Tests...\n')
  console.log(`Filter: difficulty=${config.difficulty || 'all'}, category=${config.category || 'all'}`)
  console.log('─'.repeat(50))

  const result = await runTests(config)

  console.log(formatMetricsReport(result.aggregate))

  // Print per-difficulty breakdown
  console.log('\nBy Difficulty:')
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const diffResults = result.results.filter((r) => r.testCaseId.startsWith(diff.slice(0, 4)))
    if (diffResults.length > 0) {
      const avgP5 = diffResults.reduce((s, r) => s + r.precisionAt5, 0) / diffResults.length
      console.log(`  ${diff.padEnd(8)}: ${(avgP5 * 100).toFixed(1)}% Precision@5 (${diffResults.length} tests)`)
    }
  }

  return result
}

/**
 * Export results to JSON for CI/CD integration
 */
export function resultsToJson(result: TestRunResult): string {
  return JSON.stringify(
    {
      timestamp: result.timestamp,
      durationMs: result.durationMs,
      config: result.config,
      metrics: result.aggregate,
      details: result.results.map((r) => ({
        testCaseId: r.testCaseId,
        precisionAt5: r.precisionAt5,
        mrr: r.mrr,
        ndcgAt5: r.ndcgAt5,
      })),
    },
    null,
    2
  )
}

// CLI runner
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2)
  const config: TestRunConfig = {}

  for (const arg of args) {
    if (arg.startsWith('--difficulty=')) {
      config.difficulty = arg.split('=')[1] as TestCase['difficulty']
    } else if (arg.startsWith('--category=')) {
      config.category = arg.split('=')[1]
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true
    } else if (arg === '--skip-llm') {
      config.rerankOptions = { ...config.rerankOptions, skipLLMRerank: true }
    }
  }

  runAndReport(config)
    .then((result) => {
      // Exit with error code if performance is below threshold
      if (result.aggregate.avgPrecisionAt5 < 0.5) {
        console.log('\n⚠️  Performance below threshold (50% Precision@5)')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Test run failed:', error)
      process.exit(1)
    })
}
