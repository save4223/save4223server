import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// GET /api/tool-types/stats - Get all tool types with item counts
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    // Single efficient query using aggregation
    const result = await db
      .select({
        id: itemTypes.id,
        name: itemTypes.name,
        nameCnSimplified: itemTypes.nameCnSimplified,
        nameCnTraditional: itemTypes.nameCnTraditional,
        category: itemTypes.category,
        description: itemTypes.description,
        descriptionCn: itemTypes.descriptionCn,
        imageUrl: itemTypes.imageUrl,
        maxBorrowDuration: itemTypes.maxBorrowDuration,
        total: sql<number>`count(${items.id})::int`.as('total'),
        available: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)::int`.as('available'),
      })
      .from(itemTypes)
      .leftJoin(items, eq(items.itemTypeId, itemTypes.id))
      .groupBy(itemTypes.id)
      .orderBy(itemTypes.name)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch tool type stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool type stats' },
      { status: 500 }
    )
  }
}
