import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

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

    if (!rfidTag || !itemTypeId || !homeLocationId) {
      return NextResponse.json(
        { error: 'Missing required fields: rfidTag, itemTypeId, homeLocationId' },
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

    const newItem = await db
      .insert(items)
      .values({
        rfidTag,
        itemTypeId,
        homeLocationId,
        status,
      })
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
