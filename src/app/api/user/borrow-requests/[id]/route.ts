import { NextResponse } from 'next/server'
import { db } from '@/db'
import { borrowRequests, itemTypes, accessPermissions } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

function parseIntervalDays(intervalStr: string | null): number {
  if (!intervalStr) return 7
  const match = intervalStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 7
}

// PUT /api/user/borrow-requests/[id] - Edit a PENDING request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const { id } = await params
    const requestId = parseInt(id)

    const existing = await db
      .select()
      .from(borrowRequests)
      .where(and(
        eq(borrowRequests.id, requestId),
        eq(borrowRequests.userId, auth.user!.id)
      ))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existing[0].status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING requests can be edited' }, { status: 400 })
    }

    const body = await request.json()
    const { reason, requestedStart, requestedEnd } = body

    if (!reason || !requestedStart || !requestedEnd) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const type = await db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, existing[0].itemTypeId))
      .limit(1)

    if (type.length === 0) {
      return NextResponse.json({ error: 'Tool type not found' }, { status: 404 })
    }

    const maxDays = parseIntervalDays(type[0].maxBorrowDuration)
    const start = new Date(requestedStart)
    const end = new Date(requestedEnd)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays > maxDays) {
      return NextResponse.json({ error: `Maximum borrow duration is ${maxDays} days` }, { status: 400 })
    }

    if (diffDays <= 0) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const duplicates = await db
      .select({ id: borrowRequests.id, status: borrowRequests.status })
      .from(borrowRequests)
      .where(and(
        eq(borrowRequests.userId, auth.user!.id),
        eq(borrowRequests.itemTypeId, existing[0].itemTypeId),
        ne(borrowRequests.id, requestId)
      ))

    const hasActive = duplicates.some(r => r.status === 'PENDING' || r.status === 'APPROVED')
    if (hasActive) {
      return NextResponse.json({ error: 'You already have a pending or approved request for this device' }, { status: 400 })
    }

    const updated = await db
      .update(borrowRequests)
      .set({
        reason: reason.trim(),
        requestedStart: start,
        requestedEnd: end,
      })
      .where(eq(borrowRequests.id, requestId))
      .returning()

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update borrow request:', error)
    return NextResponse.json({ error: 'Failed to update borrow request' }, { status: 500 })
  }
}

// PATCH /api/user/borrow-requests/[id] - Cancel a PENDING request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const { id } = await params
    const requestId = parseInt(id)

    const body = await request.json()
    const { action } = body

    if (action !== 'CANCEL') {
      return NextResponse.json({ error: 'Action must be CANCEL' }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(borrowRequests)
      .where(and(
        eq(borrowRequests.id, requestId),
        eq(borrowRequests.userId, auth.user!.id)
      ))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existing[0].status !== 'PENDING' && existing[0].status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only PENDING or APPROVED requests can be cancelled' }, { status: 400 })
    }

    // Revoke access permission if one was granted
    if (existing[0].accessPermissionId) {
      await db
        .update(accessPermissions)
        .set({ status: 'REVOKED' })
        .where(eq(accessPermissions.id, existing[0].accessPermissionId))
    }

    const updated = await db
      .update(borrowRequests)
      .set({ status: 'CANCELLED' })
      .where(eq(borrowRequests.id, requestId))
      .returning()

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to cancel borrow request:', error)
    return NextResponse.json({ error: 'Failed to cancel borrow request' }, { status: 500 })
  }
}
