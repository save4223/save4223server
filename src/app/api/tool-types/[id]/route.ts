import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/tool-types/[id] - Get a single tool type
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const itemId = parseInt(id)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const result = await db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, itemId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Tool type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Failed to fetch tool type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool type' },
      { status: 500 }
    )
  }
}

// PATCH /api/tool-types/[id] - Update a tool type
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
    const itemId = parseInt(id)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, category, description, imageUrl, maxBorrowDuration, totalQuantity } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (maxBorrowDuration !== undefined) updateData.maxBorrowDuration = maxBorrowDuration
    if (totalQuantity !== undefined) updateData.totalQuantity = totalQuantity

    const updated = await db
      .update(itemTypes)
      .set(updateData)
      .where(eq(itemTypes.id, itemId))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Tool type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update tool type:', error)
    return NextResponse.json(
      { error: 'Failed to update tool type' },
      { status: 500 }
    )
  }
}

// DELETE /api/tool-types/[id] - Delete a tool type
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
    const itemId = parseInt(id)

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const deleted = await db
      .delete(itemTypes)
      .where(eq(itemTypes.id, itemId))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Tool type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete tool type:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool type' },
      { status: 500 }
    )
  }
}
