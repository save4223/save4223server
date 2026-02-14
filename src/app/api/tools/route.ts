import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itemTypes, items, locations, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/tools - 获取所有工具类型及其个体
export async function GET() {
  try {
    // 获取所有工具类型
    const types = await db.select().from(itemTypes)
    
    // 如果没有工具类型，返回空数组
    if (types.length === 0) {
      return NextResponse.json([])
    }
    
    // 获取所有物品，关联位置和借用人信息
    const allItems = await db
      .select({
        item: items,
        location: locations,
        holder: profiles,
      })
      .from(items)
      .leftJoin(locations, eq(items.locationId, locations.id))
      .leftJoin(profiles, eq(items.currentHolderId, profiles.id))

    // 按工具类型分组
    const result = types.map((type) => {
      const typeItems = allItems
        .filter((i) => i.item.itemTypeId === type.id)
        .map((i) => ({
          id: i.item.id,
          rfidTag: i.item.rfidTag,
          status: i.item.status,
          holderName: i.holder?.fullName || null,
          holderEmail: i.holder?.email || null,
          dueAt: i.item.dueAt,
          homeLocation: i.location?.name || 'Unknown',
        }))

      return {
        id: type.id,
        name: type.name,
        category: type.category,
        description: type.description,
        imageUrl: type.imageUrl,
        maxBorrowDuration: type.maxBorrowDuration,
        items: typeItems,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch tools:', error)
    // 如果表不存在，返回空数组而不是报错
    if (error instanceof Error && 
        (error.message.includes('does not exist') || 
         error.message.includes('relation') ||
         error.message.includes('Failed query'))) {
      return NextResponse.json([])
    }
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}
