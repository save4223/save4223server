import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq } from 'drizzle-orm'

// GET /api/tool-types - List all tool types
export async function GET() {
  try {
    const types = await db.select().from(itemTypes)
    return NextResponse.json(types)
  } catch (error) {
    console.error('Failed to fetch tool types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool types' },
      { status: 500 }
    )
  }
}

// POST /api/tool-types - Create a new tool type
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
    const { name, category, description, imageUrl, maxBorrowDuration, totalQuantity } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const newItemType = await db
      .insert(itemTypes)
      .values({
        name,
        category: category || 'TOOL',
        description: description || null,
        imageUrl: imageUrl || null,
        maxBorrowDuration: maxBorrowDuration || '7 days',
        totalQuantity: totalQuantity || 0,
      })
      .returning()

    return NextResponse.json(newItemType[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create tool type:', error)
    return NextResponse.json(
      { error: 'Failed to create tool type' },
      { status: 500 }
    )
  }
}
