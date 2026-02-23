import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { pairingCodes } from '@/db/schema'
import { eq } from 'drizzle-orm'

// POST /api/user/pairing-token - Generate a pairing token
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate a random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    // Delete any existing code for this user
    await db.delete(pairingCodes).where(eq(pairingCodes.userId, user.id))
    
    // Insert new code
    await db.insert(pairingCodes).values({
      userId: user.id,
      token,
      expiresAt,
    })

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate pairing token:', error)
    return NextResponse.json(
      { error: 'Failed to generate pairing token' },
      { status: 500 }
    )
  }
}
