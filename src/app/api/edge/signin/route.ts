import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/edge/signin
 *
 * Edge device scans a user's sign-in QR code and calls this to identify them.
 *
 * Request Body:
 * {
 *   "user_id": "uuid from QR code",
 *   "expires_at": "ISO timestamp from QR code"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "user_id": "uuid...",
 *   "user_name": "Vicky",
 *   "email": "vicky@example.com",
 *   "role": "USER"
 * }
 */
export async function POST(request: NextRequest) {
  try {
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
    const { user_id, expires_at } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'Bad Request - user_id required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify QR code hasn't expired
    if (expires_at && new Date(expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, reason: 'QR code has expired' },
        { status: 401, headers: corsHeaders }
      )
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user_id))
      .limit(1)

    if (profile.length === 0) {
      return NextResponse.json(
        { success: false, reason: 'User not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: profile[0].id,
      user_name: profile[0].fullName || profile[0].email,
      email: profile[0].email,
      role: profile[0].role,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Edge signin error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
