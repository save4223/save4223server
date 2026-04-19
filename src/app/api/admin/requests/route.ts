import { NextResponse } from 'next/server'
import { db } from '@/db'
import { borrowRequests, profiles, itemTypes } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// GET /api/admin/requests - Get all borrow requests
export async function GET() {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const requests = await db
      .select({
        request: borrowRequests,
        user: profiles,
        itemType: itemTypes,
      })
      .from(borrowRequests)
      .leftJoin(profiles, eq(borrowRequests.userId, profiles.id))
      .leftJoin(itemTypes, eq(borrowRequests.itemTypeId, itemTypes.id))
      .orderBy(desc(borrowRequests.createdAt))

    const result = requests.map(r => ({
      id: r.request.id,
      userId: r.request.userId,
      userFullName: r.user?.fullName || 'Unknown',
      userEmail: r.user?.email || 'Unknown',
      itemTypeId: r.request.itemTypeId,
      itemType: {
        id: r.itemType?.id,
        name: r.itemType?.name,
        nameCnSimplified: r.itemType?.nameCnSimplified,
        category: r.itemType?.category,
      },
      reason: r.request.reason,
      requestedStart: r.request.requestedStart,
      requestedEnd: r.request.requestedEnd,
      status: r.request.status,
      adminReviewReason: r.request.adminReviewReason,
      reviewedAt: r.request.reviewedAt,
      createdAt: r.request.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch borrow requests:', error)
    return NextResponse.json({ error: 'Failed to fetch borrow requests' }, { status: 500 })
  }
}
