import { NextResponse } from 'next/server'
import { db } from '@/db'
import { borrowRequests, accessPermissions, items } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// PATCH /api/admin/requests/[id] - Approve or reject a borrow request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { action, reason } = body

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Action must be APPROVE or REJECT' }, { status: 400 })
    }

    // Fetch the borrow request
    const reqRows = await db
      .select()
      .from(borrowRequests)
      .where(eq(borrowRequests.id, parseInt(id)))
      .limit(1)

    if (reqRows.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const borrowReq = reqRows[0]

    if (borrowReq.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING requests can be reviewed' }, { status: 400 })
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    let accessPermissionId: number | null = null

    if (action === 'APPROVE') {
      // Find the cabinet location where this device type's items are stored
      const cabinetItems = await db
        .selectDistinct({ locationId: items.homeLocationId })
        .from(items)
        .where(eq(items.itemTypeId, borrowReq.itemTypeId))

      const locationId = cabinetItems[0]?.locationId

      if (locationId) {
        // Create access permission for the user to that cabinet
        const perm = await db
          .insert(accessPermissions)
          .values({
            userId: borrowReq.userId,
            locationId,
            status: 'APPROVED',
            validFrom: new Date(),
            validUntil: borrowReq.requestedEnd,
            approvedBy: auth.user!.id,
          })
          .returning()

        accessPermissionId = perm[0]?.id ?? null
      }
    }

    // Update the borrow request
    const updated = await db
      .update(borrowRequests)
      .set({
        status: newStatus,
        adminReviewReason: reason || null,
        reviewedBy: auth.user!.id,
        reviewedAt: new Date(),
        accessPermissionId,
      })
      .where(eq(borrowRequests.id, parseInt(id)))
      .returning()

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update borrow request:', error)
    return NextResponse.json({ error: 'Failed to update borrow request' }, { status: 500 })
  }
}
