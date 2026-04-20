import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

// POST /api/user/signin-token - Generate a time-limited sign-in QR payload
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes

    return NextResponse.json({
      userId: user.id,
      fullName: profile[0]?.fullName || profile[0]?.email || '',
      email: profile[0]?.email || '',
      role: profile[0]?.role || 'USER',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate sign-in token:', error)
    return NextResponse.json(
      { error: 'Failed to generate sign-in token' },
      { status: 500 }
    )
  }
}
