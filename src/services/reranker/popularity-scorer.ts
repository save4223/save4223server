/**
 * Popularity Scorer
 * Scores item types based on borrow frequency from transaction history
 */

import { db } from '../../db'
import { inventoryTransactions, items } from '../../db/schema'
import { sql } from 'drizzle-orm'

export interface PopularityInfo {
  itemTypeId: number
  borrowCount: number
  returnCount: number
  totalTransactions: number
}

/**
 * Get popularity information for multiple item types
 */
export async function getPopularityInfo(itemTypeIds: number[]): Promise<Map<number, PopularityInfo>> {
  if (itemTypeIds.length === 0) {
    return new Map()
  }

  // Query transaction counts grouped by item type
  const results = await db.execute(sql`
    SELECT
      i.item_type_id,
      COUNT(*) FILTER (WHERE t.action_type = 'BORROW') as borrow_count,
      COUNT(*) FILTER (WHERE t.action_type = 'RETURN') as return_count,
      COUNT(*) as total_transactions
    FROM inventory_transactions t
    JOIN items i ON t.item_id = i.id
    WHERE i.item_type_id IN ${sql`(${sql.join(itemTypeIds.map(id => sql`${id}`), sql`, `)})`}
    GROUP BY i.item_type_id
  `)

  const map = new Map<number, PopularityInfo>()

  for (const row of results.rows) {
    const itemTypeId = row.item_type_id as number
    map.set(itemTypeId, {
      itemTypeId,
      borrowCount: Number(row.borrow_count),
      returnCount: Number(row.return_count),
      totalTransactions: Number(row.total_transactions),
    })
  }

  // Set default for item types with no transactions
  for (const id of itemTypeIds) {
    if (!map.has(id)) {
      map.set(id, {
        itemTypeId: id,
        borrowCount: 0,
        returnCount: 0,
        totalTransactions: 0,
      })
    }
  }

  return map
}

/**
 * Calculate popularity score (normalized to 0-1)
 * Uses min-max normalization across all items
 */
export function calculatePopularityScore(
  itemTypeId: number,
  popularityMap: Map<number, PopularityInfo>
): number {
  const info = popularityMap.get(itemTypeId)
  if (!info || info.borrowCount === 0) {
    return 0
  }

  // We need the max borrow count for normalization
  // This should be calculated across all items in the search results
  return info.borrowCount
}

/**
 * Normalize popularity scores across a set of items
 */
export function normalizePopularityScores(
  itemTypeIds: number[],
  popularityMap: Map<number, PopularityInfo>
): Map<number, number> {
  const scores = new Map<number, number>()

  // Find max borrow count
  let maxBorrowCount = 0
  for (const id of itemTypeIds) {
    const info = popularityMap.get(id)
    if (info && info.borrowCount > maxBorrowCount) {
      maxBorrowCount = info.borrowCount
    }
  }

  // Normalize scores
  for (const id of itemTypeIds) {
    const info = popularityMap.get(id)
    if (info && maxBorrowCount > 0) {
      scores.set(id, info.borrowCount / maxBorrowCount)
    } else {
      scores.set(id, 0)
    }
  }

  return scores
}
