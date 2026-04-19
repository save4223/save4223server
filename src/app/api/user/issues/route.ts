import { NextResponse } from 'next/server'
import { db } from '@/db'
import { issueReports, items } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'

const VALID_REPORT_TYPES = ['DIDNT_BORROW', 'ALREADY_RETURNED', 'TAG_DAMAGED', 'TOOL_BROKEN', 'OTHER'] as const

// POST /api/user/issues - Create an issue report
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, reportType, description } = body

    if (!itemId || !reportType) {
      return NextResponse.json({ error: 'itemId and reportType are required' }, { status: 400 })
    }

    if (!VALID_REPORT_TYPES.includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    if (reportType === 'OTHER' && (!description || typeof description !== 'string' || description.trim() === '')) {
      return NextResponse.json({ error: 'Description is required for OTHER report type' }, { status: 400 })
    }

    // Verify the item belongs to the current user
    const item = await db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1)

    if (item.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const created = await db
      .insert(issueReports)
      .values({
        itemId,
        userId: user.id,
        reportType,
        description: description?.trim() || null,
      })
      .returning()

    return NextResponse.json(created[0])
  } catch (error) {
    console.error('Failed to create issue report:', error)
    return NextResponse.json({ error: 'Failed to create issue report' }, { status: 500 })
  }
}
