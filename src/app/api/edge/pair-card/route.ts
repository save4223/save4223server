import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pairingCodes, userCards } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

// CORS headers for edge device communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

/**
 * OPTIONS /api/edge/pair-card
 *
 * Handle CORS preflight requests from Raspberry Pi
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// POST /api/edge/pair-card - Pair an NFC card with a user (called by Pi)
export async function POST(request: NextRequest) {
  try {
    // Verify edge device API key
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.slice(7)
    if (token !== EDGE_API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { pairing_token, card_uid, cabinet_id } = body

    if (!pairing_token || !card_uid) {
      return NextResponse.json(
        { error: 'Missing required fields: pairing_token, card_uid' },
        { status: 400, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
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
        }, { headers: corsHeaders })
      } else {
        return NextResponse.json(
          { error: 'This card is already linked to another user' },
          { status: 409, headers: corsHeaders }
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
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Failed to pair card:', error)
    return NextResponse.json(
      { error: 'Failed to pair card' },
      { status: 500, headers: corsHeaders }
    )
  }
}
