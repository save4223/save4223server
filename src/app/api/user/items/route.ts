import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items, itemTypes, locations, inventoryTransactions, cabinetSessions } from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'

// GET /api/user/items - 获取当前用户的借用物品和交易记录
export async function GET() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 1. 获取用户当前持有的物品
    const heldItems = await db
      .select({
        item: items,
        type: itemTypes,
        location: locations,
      })
      .from(items)
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .leftJoin(locations, eq(items.homeLocationId, locations.id))
      .where(eq(items.currentHolderId, userId))

    // 2. 获取最近5次交易记录
    const recentTransactions = await db
      .select({
        transaction: inventoryTransactions,
        item: items,
        type: itemTypes,
        session: cabinetSessions,
      })
      .from(inventoryTransactions)
      .leftJoin(items, eq(inventoryTransactions.itemId, items.id))
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .leftJoin(cabinetSessions, eq(inventoryTransactions.sessionId, cabinetSessions.id))
      .where(eq(inventoryTransactions.userId, userId))
      .orderBy(desc(inventoryTransactions.timestamp))
      .limit(5)

    // 格式化持有的物品
    const formattedHeldItems = heldItems.map((i) => ({
      id: i.item.id,
      rfidTag: i.item.rfidTag,
      status: i.item.status,
      dueAt: i.item.dueAt,
      itemType: {
        id: i.type?.id,
        name: i.type?.name,
        category: i.type?.category,
        description: i.type?.description,
        imageUrl: i.type?.imageUrl,
      },
      homeLocation: i.location?.name || 'Unknown',
    }))

    // 格式化交易记录
    const formattedTransactions = recentTransactions.map((t) => ({
      id: t.transaction.id,
      actionType: t.transaction.actionType,
      timestamp: t.transaction.timestamp,
      item: {
        id: t.item?.id,
        rfidTag: t.item?.rfidTag,
        itemType: {
          name: t.type?.name,
          category: t.type?.category,
        },
      },
      session: {
        id: t.session?.id,
        cabinetId: t.session?.cabinetId,
        startTime: t.session?.startTime,
      },
    }))

    return NextResponse.json({
      heldItems: formattedHeldItems,
      recentTransactions: formattedTransactions,
    })
  } catch (error) {
    console.error('Failed to fetch user items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user items' },
      { status: 500 }
    )
  }
}
