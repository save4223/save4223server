import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userCards, locations, accessPermissions } from '@/db/schema'
import { eq, and, or, gt } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

/**
 * POST /api/edge/authorize
 * 
 * Edge device (Raspberry Pi) calls this to check if a user can open a cabinet.
 * 
 * Request Body:
 * {
 *   "card_uid": "ABC123",
 *   "cabinet_id": 1
 * }
 * 
 * Response:
 * {
 *   "authorized": true,
 *   "session_id": "uuid...",
 *   "user_id": "uuid...",
 *   "user_name": "Vicky"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify edge device API key
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.slice(7)
    if (token !== EDGE_API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { card_uid, cabinet_id } = body

    if (!card_uid || !cabinet_id) {
      return NextResponse.json(
        { error: 'Bad Request - card_uid and cabinet_id required' },
        { status: 400 }
      )
    }

    // 1. Lookup user by card UID
    const card = await db.query.userCards.findFirst({
      where: eq(userCards.cardUid, card_uid),
    })

    if (!card) {
      return NextResponse.json(
        { authorized: false, reason: 'Card not registered' },
        { status: 403 }
      )
    }

    if (!card.isActive) {
      return NextResponse.json(
        { authorized: false, reason: 'Card deactivated' },
        { status: 403 }
      )
    }

    // Update last used timestamp
    await db.update(userCards)
      .set({ lastUsedAt: new Date() })
      .where(eq(userCards.id, card.id))

    // 2. Check cabinet access restrictions
    const cabinet = await db.query.locations.findFirst({
      where: eq(locations.id, cabinet_id),
    })

    if (!cabinet) {
      return NextResponse.json(
        { authorized: false, reason: 'Cabinet not found' },
        { status: 404 }
      )
    }

    // 3. If restricted, check access permissions
    if (cabinet.isRestricted) {
      const permission = await db.query.accessPermissions.findFirst({
        where: and(
          eq(accessPermissions.userId, card.userId),
          eq(accessPermissions.locationId, cabinet_id),
          eq(accessPermissions.status, 'APPROVED'),
          or(
            eq(accessPermissions.validUntil, null as any),
            gt(accessPermissions.validUntil, new Date())
          )
        ),
      })

      if (!permission) {
        return NextResponse.json(
          { 
            authorized: false, 
            reason: 'Access denied - Restricted cabinet, no valid permission',
            user_id: card.userId
          },
          { status: 403 }
        )
      }
    }

    // 4. Create a new cabinet session
    const { v4: uuidv4 } = await import('uuid')
    const sessionId = uuidv4()

    // Get user profile for name
    const userData = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, card.userId),
    })

    return NextResponse.json({
      authorized: true,
      session_id: sessionId,
      user_id: card.userId,
      user_name: userData?.fullName || userData?.email || 'Unknown',
      cabinet_name: cabinet.name,
    })

  } catch (error) {
    console.error('Authorize error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
