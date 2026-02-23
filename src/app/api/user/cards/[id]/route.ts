import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { userCards } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/user/cards/[id] - Revoke a card
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
    const cardId = parseInt(id)

    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Invalid card ID' },
        { status: 400 }
      )
    }

    // Delete only if the card belongs to the current user
    const deleted = await db
      .delete(userCards)
      .where(and(
        eq(userCards.id, cardId),
        eq(userCards.userId, user.id)
      ))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Card not found or not authorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to revoke card:', error)
    return NextResponse.json(
      { error: 'Failed to revoke card' },
      { status: 500 }
    )
  }
}
