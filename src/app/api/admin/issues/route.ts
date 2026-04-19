import { NextResponse } from 'next/server'
import { db } from '@/db'
import { issueReports, items, itemTypes, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// GET /api/admin/issues - Get all issue reports
export async function GET() {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const reports = await db
      .select({
        report: issueReports,
        item: items,
        itemType: itemTypes,
        user: profiles,
      })
      .from(issueReports)
      .leftJoin(items, eq(issueReports.itemId, items.id))
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .leftJoin(profiles, eq(issueReports.userId, profiles.id))
      .orderBy(desc(issueReports.createdAt))

    const result = reports.map(r => ({
      id: r.report.id,
      reportType: r.report.reportType,
      description: r.report.description,
      status: r.report.status,
      createdAt: r.report.createdAt,
      resolvedAt: r.report.resolvedAt,
      item: {
        id: r.item?.id,
        rfidTag: r.item?.rfidTag,
      },
      itemType: {
        id: r.itemType?.id,
        name: r.itemType?.name,
        category: r.itemType?.category,
      },
      user: {
        id: r.user?.id,
        fullName: r.user?.fullName || 'Unknown',
        email: r.user?.email || 'Unknown',
      },
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch issue reports:', error)
    return NextResponse.json({ error: 'Failed to fetch issue reports' }, { status: 500 })
  }
}
