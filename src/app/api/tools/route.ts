import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes, items, locations, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

export const dynamic = 'force-dynamic'

// GET /api/tools - fetch all tool types with their items in one query
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    // Single query: JOIN items + locations + profiles + itemTypes
    // instead of 2 separate queries + JS grouping
    const rows = await db
      .select({
        // Item type fields
        typeId: itemTypes.id,
        typeName: itemTypes.name,
        typeNameCnSimplified: itemTypes.nameCnSimplified,
        typeNameCnTraditional: itemTypes.nameCnTraditional,
        typeCategory: itemTypes.category,
        typeDescription: itemTypes.description,
        typeDescriptionCn: itemTypes.descriptionCn,
        typeImageUrl: itemTypes.imageUrl,
        typeMaxBorrowDuration: itemTypes.maxBorrowDuration,
        // Item fields
        itemId: items.id,
        itemRfidTag: items.rfidTag,
        itemStatus: items.status,
        itemDueAt: items.dueAt,
        // Joined fields
        holderName: profiles.fullName,
        holderEmail: profiles.email,
        locationName: locations.name,
      })
      .from(itemTypes)
      .leftJoin(items, eq(itemTypes.id, items.itemTypeId))
      .leftJoin(locations, eq(items.homeLocationId, locations.id))
      .leftJoin(profiles, eq(items.currentHolderId, profiles.id))

    // Group rows by type (single pass)
    const typeMap = new Map<number, {
      id: number
      name: string
      nameCnSimplified: string | null
      nameCnTraditional: string | null
      category: string | null
      description: string | null
      descriptionCn: string | null
      imageUrl: string | null
      maxBorrowDuration: string | null
      items: any[]
    }>()

    for (const row of rows) {
      if (!typeMap.has(row.typeId)) {
        typeMap.set(row.typeId, {
          id: row.typeId,
          name: row.typeName,
          nameCnSimplified: row.typeNameCnSimplified,
          nameCnTraditional: row.typeNameCnTraditional,
          category: row.typeCategory,
          description: row.typeDescription,
          descriptionCn: row.typeDescriptionCn,
          imageUrl: row.typeImageUrl,
          maxBorrowDuration: row.typeMaxBorrowDuration,
          items: [],
        })
      }

      // Only add item if it exists (leftJoin can produce null item rows for types with no items)
      if (row.itemId) {
        typeMap.get(row.typeId)!.items.push({
          id: row.itemId,
          rfidTag: row.itemRfidTag,
          status: row.itemStatus,
          holderName: row.holderName || null,
          holderEmail: row.holderEmail || null,
          dueAt: row.itemDueAt,
          homeLocation: row.locationName || 'Unknown',
        })
      }
    }

    return NextResponse.json(Array.from(typeMap.values()))
  } catch (error) {
    console.error('Failed to fetch tools:', error)
    if (error instanceof Error &&
        (error.message.includes('does not exist') ||
         error.message.includes('relation') ||
         error.message.includes('Failed query'))) {
      return NextResponse.json([])
    }
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}
