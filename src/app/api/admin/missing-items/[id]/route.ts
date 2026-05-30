import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

/**
 * PATCH /api/admin/missing-items/[id]
 * Update a MISSING item: confirm (→ AVAILABLE) or write off
 *
 * Body: { action: 'CONFIRM_AVAILABLE' | 'WRITE_OFF' }
 */
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
    const { action } = body

    if (!action || !['CONFIRM_AVAILABLE', 'WRITE_OFF'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be CONFIRM_AVAILABLE or WRITE_OFF' },
        { status: 400 }
      )
    }

    const existing = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (existing[0].status !== 'MISSING') {
      return NextResponse.json(
        { error: 'Item is not in MISSING status' },
        { status: 400 }
      )
    }

    const newStatus = action === 'CONFIRM_AVAILABLE' ? 'AVAILABLE' : 'MAINTENANCE'
    const updated = await db
      .update(items)
      .set({
        status: newStatus,
        currentHolderId: null,
        dueAt: null,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning()

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update missing item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/missing-items/[id]
 * Permanently remove a MISSING item from the system.
 * Cascades: related inventory_transactions and issue_reports are also deleted.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const { id } = await params

    const existing = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1)

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (existing[0].status !== 'MISSING') {
      return NextResponse.json(
        { error: 'Only MISSING items can be deleted' },
        { status: 400 }
      )
    }

    await db.delete(items).where(eq(items.id, id))

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error('Failed to delete missing item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
