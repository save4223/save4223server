import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items, locations, profiles } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

// GET /api/items - List items (optionally filtered by typeId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('typeId')

    if (typeId) {
      const result = await db
        .select({
          item: items,
          location: locations,
          holder: profiles,
        })
        .from(items)
        .leftJoin(locations, eq(items.homeLocationId, locations.id))
        .leftJoin(profiles, eq(items.currentHolderId, profiles.id))
        .where(eq(items.itemTypeId, parseInt(typeId)))

      return NextResponse.json(
        result.map(({ item, location, holder }) => ({
          ...item,
          homeLocation: location?.name || 'Unknown',
          currentHolder: holder?.fullName || null,
        }))
      )
    }

    const allItems = await db.select().from(items)
    return NextResponse.json(allItems)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create a new tool item
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rfidTag, itemTypeId, homeLocationId, status = 'AVAILABLE' } = body

    if (!rfidTag || !itemTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields: rfidTag, itemTypeId' },
        { status: 400 }
      )
    }

    // Check if RFID already exists
    const existing = await db
      .select()
      .from(items)
      .where(eq(items.rfidTag, rfidTag))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'RFID tag already exists' },
        { status: 409 }
      )
    }

    const insertData: {
      rfidTag: string;
      itemTypeId: number;
      status: 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE';
      homeLocationId?: number;
    } = {
      rfidTag,
      itemTypeId,
      status: status as 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE',
    }

    if (homeLocationId !== null && homeLocationId !== undefined) {
      insertData.homeLocationId = homeLocationId
    }

    const newItem = await db
      .insert(items)
      .values(insertData)
      .returning()

    return NextResponse.json(newItem[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
