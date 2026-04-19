import { NextResponse } from 'next/server'
import { db } from '@/db'
import { borrowRequests } from '@/db/schema'
import { eq } from 'drizzle-orm'
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

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    const updated = await db
      .update(borrowRequests)
      .set({
        status: newStatus,
        adminReviewReason: reason || null,
        reviewedBy: auth.user!.id,
        reviewedAt: new Date(),
      })
      .where(eq(borrowRequests.id, parseInt(id)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update borrow request:', error)
    return NextResponse.json({ error: 'Failed to update borrow request' }, { status: 500 })
  }
}
