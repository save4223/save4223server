import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/db'
import { items, itemTypes, reconciliationLogs, locations } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/edge/reconcile
 *
 * Cabinet uploads inventory reconciliation data after a full scan.
 * Server updates item statuses and logs the result.
 *
 * Body:
 * {
 *   "cabinet_id": 1,
 *   "scanned_tags": ["E280...", "E280..."],
 *   "missing_items": [{"rfid_tag": "...", "item_id": "...", "name": "..."}],
 *   "recovered_items": [{"rfid_tag": "...", "item_id": "...", "name": "..."}],
 *   "total_scanned": 78
 * }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - Bearer token required' },
      { status: 401, headers: corsHeaders }
    )
  }

  const token = authHeader.slice(7)
  if (token !== EDGE_API_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401, headers: corsHeaders }
    )
  }

  try {
    const body = await request.json()
    const { cabinet_id, scanned_tags, missing_items, recovered_items, total_scanned } = body

    if (!cabinet_id || !Array.isArray(scanned_tags)) {
      return NextResponse.json(
        { error: 'cabinet_id and scanned_tags are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify cabinet exists
    const cabinet = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.id, cabinet_id))
      .limit(1)

    if (cabinet.length === 0) {
      return NextResponse.json(
        { error: 'Cabinet not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const missingList: Array<{ rfidTag: string; itemId: string; name: string }> = missing_items || []
    const recoveredList: Array<{ rfidTag: string; itemId: string; name: string }> = recovered_items || []

    // Mark missing items
    for (const item of missingList) {
      await db
        .update(items)
        .set({ status: 'MISSING', updatedAt: new Date() })
        .where(eq(items.id, item.item_id))
    }

    // Mark recovered items as AVAILABLE
    for (const item of recoveredList) {
      await db
        .update(items)
        .set({ status: 'AVAILABLE', currentHolderId: null, dueAt: null, updatedAt: new Date() })
        .where(eq(items.id, item.item_id))
    }

    // Use scanned_tags as ground truth: items at this location that were NOT scanned
    // and are currently AVAILABLE should be flagged
    if (scanned_tags.length > 0) {
      // Get all items at this cabinet that weren't in the scan
      const cabinetItems = await db
        .select({ id: items.id, rfidTag: items.rfidTag, status: items.status })
        .from(items)
        .where(eq(items.homeLocationId, cabinet_id))

      const scannedSet = new Set(scanned_tags)
      const unscannedAvailable = cabinetItems.filter(
        item => !scannedSet.has(item.rfidTag) && item.status === 'AVAILABLE'
      )

      for (const item of unscannedAvailable) {
        await db
          .update(items)
          .set({ status: 'MISSING', updatedAt: new Date() })
          .where(eq(items.id, item.id))
      }
    }

    // Log the reconciliation
    const summary = `${missingList.length} missing, ${recoveredList.length} recovered, ${total_scanned} total scanned`
    await db.insert(reconciliationLogs).values({
      cabinetId: cabinet_id,
      totalScanned: total_scanned || scanned_tags.length,
      missingCount: missingList.length,
      recoveredCount: recoveredList.length,
      scannedTags: scanned_tags,
      summary,
    })

    return NextResponse.json({
      success: true,
      missing_updated: missingList.length,
      recovered_updated: recoveredList.length,
      summary,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('[Reconcile] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
