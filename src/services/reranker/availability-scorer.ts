/**
 * Availability Scorer
 * Scores item types based on availability of individual items
 */

import { db } from '../../db'
import { items } from '../../db/schema'
import { sql, eq } from 'drizzle-orm'

export interface AvailabilityInfo {
  itemTypeId: number
  total: number
  available: number
  borrowed: number
  maintenance: number
  missing: number
  availabilityRatio: number
}

/**
 * Get availability information for multiple item types
 */
export async function getAvailabilityInfo(itemTypeIds: number[]): Promise<Map<number, AvailabilityInfo>> {
  if (itemTypeIds.length === 0) {
    return new Map()
  }

  const results = await db.execute(sql`
    SELECT
      item_type_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available,
      COUNT(*) FILTER (WHERE status = 'BORROWED') as borrowed,
      COUNT(*) FILTER (WHERE status = 'MAINTENANCE') as maintenance,
      COUNT(*) FILTER (WHERE status = 'MISSING') as missing
    FROM items
    WHERE item_type_id IN ${sql`(${sql.join(itemTypeIds.map(id => sql`${id}`), sql`, `)})`}
    GROUP BY item_type_id
  `)

  const map = new Map<number, AvailabilityInfo>()

  for (const row of results.rows) {
    const itemTypeId = row.item_type_id as number
    const total = Number(row.total)
    const available = Number(row.available)
    const availabilityRatio = total > 0 ? available / total : 0

    map.set(itemTypeId, {
      itemTypeId,
      total,
      available,
      borrowed: Number(row.borrowed),
      maintenance: Number(row.maintenance),
      missing: Number(row.missing),
      availabilityRatio,
    })
  }

  // Set default for item types with no items
  for (const id of itemTypeIds) {
    if (!map.has(id)) {
      map.set(id, {
        itemTypeId: id,
        total: 0,
        available: 0,
        borrowed: 0,
        maintenance: 0,
        missing: 0,
        availabilityRatio: 0,
      })
    }
  }

  return map
}

/**
 * Calculate availability score (normalized to 0-1)
 * Higher score = more available items
 */
export function calculateAvailabilityScore(info: AvailabilityInfo): number {
  // If no items exist, score is 0
  if (info.total === 0) {
    return 0
  }

  // Use availability ratio directly
  // Could add penalties for maintenance/missing items if needed
  return info.availabilityRatio
}

/**
 * Filter out item types with no available items
 */
export function filterUnavailable(
  itemTypeIds: number[],
  availabilityMap: Map<number, AvailabilityInfo>
): number[] {
  return itemTypeIds.filter((id) => {
    const info = availabilityMap.get(id)
    return info && info.available > 0
  })
}
