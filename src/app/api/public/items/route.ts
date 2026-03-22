import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items, itemTypes, locations } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/public/items
 *
 * Public API for displaying items without authentication.
 * Used by Pi display and other public-facing interfaces.
 *
 * Query Params:
 *   ?locationId=1 - Filter by location/cabinet
 *
 * Response:
 * {
 *   "items": [
 *     {
 *       "id": "uuid",
 *       "rfidTag": "ABC123",
 *       "name": "Arduino Uno",
 *       "typeName": "Microcontroller",
 *       "status": "AVAILABLE",
 *       "locationName": "Cabinet A"
 *     }
 *   ]
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    // Build query with joins
    const result = await db
      .select({
        id: items.id,
        rfidTag: items.rfidTag,
        status: items.status,
        itemTypeId: items.itemTypeId,
        homeLocationId: items.homeLocationId,
        typeName: itemTypes.name,
        typeNameCn: itemTypes.nameCnSimplified,
        typeCategory: itemTypes.category,
        locationName: locations.name,
      })
      .from(items)
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .leftJoin(locations, eq(items.homeLocationId, locations.id))

    // Filter by location if specified
    const filteredResult = locationId
      ? result.filter(item => item.homeLocationId === parseInt(locationId))
      : result

    // Transform to clean response
    const itemsList = filteredResult.map(item => ({
      id: item.id,
      rfidTag: item.rfidTag,
      name: item.typeName || 'Unknown',
      nameCn: item.typeNameCn,
      category: item.typeCategory,
      status: item.status,
      locationId: item.homeLocationId,
      locationName: item.locationName || 'Unknown',
    }))

    return NextResponse.json({
      items: itemsList,
      total: itemsList.length,
    })
  } catch (error) {
    console.error('Failed to fetch public items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
