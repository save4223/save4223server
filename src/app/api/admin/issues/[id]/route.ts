import { NextResponse } from 'next/server'
import { db } from '@/db'
import { issueReports } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// PATCH /api/admin/issues/[id] - Update issue report status
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
    const { status } = body

    if (!status || !['RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be RESOLVED or DISMISSED' }, { status: 400 })
    }

    const updated = await db
      .update(issueReports)
      .set({
        status,
        resolvedAt: new Date(),
        resolvedBy: auth.user!.id,
      })
      .where(eq(issueReports.id, parseInt(id)))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error('Failed to update issue report:', error)
    return NextResponse.json({ error: 'Failed to update issue report' }, { status: 500 })
  }
}
