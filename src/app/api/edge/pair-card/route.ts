import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pairingCodes, userCards } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'

// POST /api/edge/pair-card - Pair an NFC card with a user (called by Pi)
export async function POST(request: Request) {
  try {
    // Verify edge device secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.EDGE_DEVICE_SECRET_KEY
    
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pairing_token, card_uid, cabinet_id } = body

    if (!pairing_token || !card_uid) {
      return NextResponse.json(
        { error: 'Missing required fields: pairing_token, card_uid' },
        { status: 400 }
      )
    }

    // Find valid pairing code
    const now = new Date()
    const pairingCode = await db
      .select()
      .from(pairingCodes)
      .where(and(
        eq(pairingCodes.token, pairing_token),
        gt(pairingCodes.expiresAt, now)
      ))
      .limit(1)

    if (pairingCode.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired pairing code' },
        { status: 400 }
      )
    }

    const userId = pairingCode[0].userId

    // Check if card is already linked to another user
    const existingCard = await db
      .select()
      .from(userCards)
      .where(eq(userCards.cardUid, card_uid))
      .limit(1)

    if (existingCard.length > 0) {
      if (existingCard[0].userId === userId) {
        // Card already linked to this user, just update lastUsedAt
        await db
          .update(userCards)
          .set({ lastUsedAt: now, isActive: true })
          .where(eq(userCards.id, existingCard[0].id))
        
        return NextResponse.json({
          success: true,
          message: 'Card already linked to your account',
          userId,
          cardUid: card_uid,
        })
      } else {
        return NextResponse.json(
          { error: 'This card is already linked to another user' },
          { status: 409 }
        )
      }
    }

    // Link the card to the user
    await db.insert(userCards).values({
      userId,
      cardUid: card_uid,
      isActive: true,
      lastUsedAt: now,
    })

    // Delete the used pairing code
    await db
      .delete(pairingCodes)
      .where(eq(pairingCodes.token, pairing_token))

    return NextResponse.json({
      success: true,
      message: 'Card successfully linked to your account',
      userId,
      cardUid: card_uid,
    })
  } catch (error) {
    console.error('Failed to pair card:', error)
    return NextResponse.json(
      { error: 'Failed to pair card' },
      { status: 500 }
    )
  }
}
