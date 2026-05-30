import { NextResponse } from 'next/server'
import { db } from '@/db'
import { items, itemTypes } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkAuth } from '@/utils/auth-helpers'

/**
 * GET /api/admin/missing-items
 * Returns all items with MISSING status
 */
export async function GET() {
  const auth = await checkAuth('ADMIN')
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const missing = await db
      .select({
        id: items.id,
        rfidTag: items.rfidTag,
        status: items.status,
        updatedAt: items.updatedAt,
        typeName: itemTypes.name,
        typeId: itemTypes.id,
      })
      .from(items)
      .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
      .where(eq(items.status, 'MISSING'))

    return NextResponse.json(missing)
  } catch (error) {
    console.error('Failed to fetch missing items:', error)
    return NextResponse.json({ error: 'Failed to fetch missing items' }, { status: 500 })
  }
}
