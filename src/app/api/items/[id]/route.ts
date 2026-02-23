import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/items/[id] - Get a single item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const result = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Failed to fetch item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PATCH /api/items/[id] - Update an item
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { rfidTag, itemTypeId, homeLocationId, status, currentHolderId } = body

    const updateData: Record<string, unknown> = {}
    if (rfidTag !== undefined) updateData.rfidTag = rfidTag
    if (itemTypeId !== undefined) updateData.itemTypeId = itemTypeId
    if (homeLocationId !== undefined) updateData.homeLocationId = homeLocationId
    if (status !== undefined) updateData.status = status
    if (currentHolderId !== undefined) updateData.currentHolderId = currentHolderId

    const updated = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const deleted = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
