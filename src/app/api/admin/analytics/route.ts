import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes, items, inventoryTransactions, issueReports } from '@/db/schema'
import { eq, sql, count, and, gte } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

// GET /api/admin/analytics - Get metrics for all tool types
export async function GET() {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all tool types
    const types = await db.select().from(itemTypes).orderBy(itemTypes.name)

    if (types.length === 0) {
      return NextResponse.json({ metrics: [], summary: { totalTypes: 0, totalItems: 0, totalBorrows: 0, totalWarnings: 0 } })
    }

    // Get all items grouped by type
    const allItems = await db
      .select({
        id: items.id,
        itemTypeId: items.itemTypeId,
        status: items.status,
        dueAt: items.dueAt,
      })
      .from(items)

    // Get borrows this month
    const borrowsThisMonth = await db
      .select({
        itemTypeId: itemTypes.id,
        count: count(),
      })
      .from(inventoryTransactions)
      .leftJoin(items, eq(inventoryTransactions.itemId, items.id))
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .where(and(
        eq(inventoryTransactions.actionType, 'BORROW'),
        gte(inventoryTransactions.timestamp, monthStart)
      ))
      .groupBy(itemTypes.id)

    // Get damage reports this month
    const damageReportsThisMonth = await db
      .select({
        itemTypeId: items.itemTypeId,
        count: count(),
      })
      .from(issueReports)
      .leftJoin(items, eq(issueReports.itemId, items.id))
      .where(gte(issueReports.createdAt, monthStart))
      .groupBy(items.itemTypeId)

    // Build metrics map
    const borrowsMap = new Map(borrowsThisMonth.map(b => [b.itemTypeId, b.count]))
    const damageMap = new Map(damageReportsThisMonth.map(d => [d.itemTypeId, d.count]))

    const typeItems = new Map<number, typeof allItems>()
    for (const item of allItems) {
      if (!typeItems.has(item.itemTypeId)) {
        typeItems.set(item.itemTypeId, [])
      }
      typeItems.get(item.itemTypeId)!.push(item)
    }

    const metrics = types.map(type => {
      const typeItemInstances = typeItems.get(type.id) || []
      const total = typeItemInstances.length
      const available = typeItemInstances.filter(i => i.status === 'AVAILABLE').length
      const borrowed = typeItemInstances.filter(i => i.status === 'BORROWED')
      const overdue = borrowed.filter(i => i.dueAt && new Date(i.dueAt) < now).length

      const availabilityPercent = total > 0 ? Math.round((available / total) * 100) : 100
      const overdueRate = borrowed.length > 0 ? Math.round((overdue / borrowed.length) * 100) : 0
      const isLowStock = type.category === 'CONSUMABLE'
        ? (type.currentStock ?? 0) < (type.minThreshold ?? 0)
        : available < (type.minThreshold ?? 0)

      return {
        id: type.id,
        name: type.name,
        nameCnSimplified: type.nameCnSimplified,
        nameCnTraditional: type.nameCnTraditional,
        category: type.category,
        total,
        available,
        availabilityPercent,
        borrowsThisMonth: borrowsMap.get(type.id) ?? 0,
        overdueRate,
        damageReportsThisMonth: damageMap.get(type.id) ?? 0,
        isLowStock,
        minThreshold: type.minThreshold ?? 0,
        currentStock: type.currentStock ?? 0,
      }
    })

    const totalTypes = types.length
    const totalItems = allItems.length
    const totalBorrows = metrics.reduce((sum, m) => sum + m.borrowsThisMonth, 0)
    const totalWarnings = metrics.filter(m => m.isLowStock).length

    return NextResponse.json({
      metrics,
      summary: { totalTypes, totalItems, totalBorrows, totalWarnings },
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
