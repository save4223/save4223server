import { NextResponse } from 'next/server'
import { db } from '@/db'
import { borrowRequests, itemTypes } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

function parseIntervalDays(intervalStr: string | null): number {
  if (!intervalStr) return 7
  const match = intervalStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 7
}

// POST /api/user/borrow-requests - Create a borrow request
export async function POST(request: Request) {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const body = await request.json()
    const { itemTypeId, reason, requestedStart, requestedEnd } = body

    if (!itemTypeId || !reason || !requestedStart || !requestedEnd) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const type = await db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, itemTypeId))
      .limit(1)

    if (type.length === 0) {
      return NextResponse.json({ error: 'Tool type not found' }, { status: 404 })
    }

    if (type[0].category !== 'DEVICE') {
      return NextResponse.json({ error: 'Borrow requests are only for DEVICE category items' }, { status: 400 })
    }

    const maxDays = parseIntervalDays(type[0].maxBorrowDuration)
    const start = new Date(requestedStart)
    const end = new Date(requestedEnd)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays > maxDays) {
      return NextResponse.json({ error: `Maximum borrow duration is ${maxDays} days` }, { status: 400 })
    }

    if (start < new Date()) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 })
    }

    const existing = await db
      .select({ id: borrowRequests.id, status: borrowRequests.status })
      .from(borrowRequests)
      .where(and(
        eq(borrowRequests.userId, auth.user!.id),
        eq(borrowRequests.itemTypeId, itemTypeId)
      ))

    const hasActive = existing.some(r => r.status === 'PENDING' || r.status === 'APPROVED')
    if (hasActive) {
      return NextResponse.json({ error: 'You already have a pending or approved request for this device' }, { status: 400 })
    }

    const created = await db
      .insert(borrowRequests)
      .values({
        userId: auth.user!.id,
        itemTypeId,
        reason: reason.trim(),
        requestedStart: start,
        requestedEnd: end,
      })
      .returning()

    return NextResponse.json(created[0])
  } catch (error) {
    console.error('Failed to create borrow request:', error)
    return NextResponse.json({ error: 'Failed to create borrow request' }, { status: 500 })
  }
}

// GET /api/user/borrow-requests - Get current user's borrow requests
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const requests = await db
      .select({
        request: borrowRequests,
        itemType: itemTypes,
      })
      .from(borrowRequests)
      .leftJoin(itemTypes, eq(borrowRequests.itemTypeId, itemTypes.id))
      .where(eq(borrowRequests.userId, auth.user!.id))
      .orderBy(borrowRequests.createdAt)

    const result = requests.map(r => ({
      id: r.request.id,
      reason: r.request.reason,
      requestedStart: r.request.requestedStart,
      requestedEnd: r.request.requestedEnd,
      status: r.request.status,
      adminReviewReason: r.request.adminReviewReason,
      reviewedAt: r.request.reviewedAt,
      createdAt: r.request.createdAt,
      itemType: {
        id: r.itemType?.id,
        name: r.itemType?.name,
        nameCnSimplified: r.itemType?.nameCnSimplified,
        category: r.itemType?.category,
      },
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch borrow requests:', error)
    return NextResponse.json({ error: 'Failed to fetch borrow requests' }, { status: 500 })
  }
}
