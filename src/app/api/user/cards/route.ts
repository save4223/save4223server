import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { userCards } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/user/cards - Get user's linked cards
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cards = await db
      .select()
      .from(userCards)
      .where(eq(userCards.userId, user.id))
      .orderBy(desc(userCards.createdAt))

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Failed to fetch user cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}
