import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { cabinetSessions, inventoryTransactions, items, itemTypes, locations, profiles } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { sendCheckoutEmail } from '@/lib/email-service'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

// CORS headers for edge device communication
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

/**
 * OPTIONS /api/edge/sync-session
 *
 * Handle CORS preflight requests from Raspberry Pi
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * POST /api/edge/sync-session
 * 
 * Edge device calls this after door closes to finalize the session.
 * Server calculates BORROW/RETURN actions by diffing RFID snapshots.
 * 
 * Request Body:
 * {
 *   "session_id": "uuid...",
 *   "user_id": "uuid...",
 *   "cabinet_id": 1,
 *   "start_rfids": ["tag1", "tag2"],
 *   "end_rfids": ["tag2", "tag3"],
 *   "evidence_image": "base64..." (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "transactions": [
 *     { "item_id": "...", "action": "BORROW", "rfid_tag": "tag1" },
 *     { "item_id": "...", "action": "RETURN", "rfid_tag": "tag3" }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify edge device API key
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

    // Parse request body
    const body = await request.json()
    const {
      session_id,
      user_id,
      cabinet_id,
      start_rfids = [],
      end_rfids = [],
      evidence_image
    } = body

    if (!session_id || !user_id || !cabinet_id) {
      return NextResponse.json(
        { error: 'Bad Request - session_id, user_id, and cabinet_id required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate UUID format
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(String(session_id))) {
      return NextResponse.json(
        { error: 'Bad Request - session_id must be a valid UUID', value: session_id },
        { status: 400, headers: corsHeaders }
      )
    }
    if (!UUID_REGEX.test(String(user_id))) {
      return NextResponse.json(
        { error: 'Bad Request - user_id must be a valid UUID', value: user_id },
        { status: 400, headers: corsHeaders }
      )
    }
    if (!Number.isInteger(cabinet_id) || cabinet_id < 1) {
      return NextResponse.json(
        { error: 'Bad Request - cabinet_id must be a positive integer', value: cabinet_id },
        { status: 400, headers: corsHeaders }
      )
    }

    // 1. Create or update cabinet session
    const now = new Date()

    // Verify cabinet exists in locations table (FK constraint)
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, cabinet_id),
    })
    if (!location) {
      console.error(`[SyncSession] Location not found: cabinet_id=${cabinet_id}`)
      return NextResponse.json(
        { error: 'Not Found - cabinet_id not found in locations', cabinet_id },
        { status: 404, headers: corsHeaders }
      )
    }

    // Check if session exists
    const existingSession = await db.query.cabinetSessions.findFirst({
      where: eq(cabinetSessions.id, session_id),
    })

    if (existingSession) {
      // Update existing session
      await db.update(cabinetSessions)
        .set({
          endTime: now,
          status: 'COMPLETED',
          snapshotEndRfids: end_rfids,
        })
        .where(eq(cabinetSessions.id, session_id))
    } else {
      // Create new session
      await db.insert(cabinetSessions).values({
        id: session_id,
        cabinetId: cabinet_id,
        userId: user_id,
        startTime: now,
        endTime: now,
        status: 'COMPLETED',
        snapshotStartRfids: start_rfids,
        snapshotEndRfids: end_rfids,
      })
    }

    // 2. Calculate diff between start and end RFIDs
    const startSet = new Set(start_rfids)
    const endSet = new Set(end_rfids)

    // Missing from end = BORROWED
    const borrowedRfids = start_rfids.filter((tag: string) => !endSet.has(tag))
    
    // New in end = RETURNED
    const returnedRfids = end_rfids.filter((tag: string) => !startSet.has(tag))

    // 3. Lookup item IDs from RFID tags
    const allRfids = [...borrowedRfids, ...returnedRfids]
    
    if (allRfids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No inventory changes detected',
        transactions: [],
      }, { headers: corsHeaders })
    }

    // Query items
    const itemsData = await db.query.items.findMany({
      where: inArray(items.rfidTag, allRfids),
    })

    // Query item types separately for borrow duration
    const itemTypeIds = [...new Set(itemsData.map(item => item.itemTypeId))]
    const itemTypesData = await db.query.itemTypes.findMany({
      where: inArray(itemTypes.id, itemTypeIds),
    })
    const itemTypeMap = new Map(itemTypesData.map(t => [t.id, t]))

    const rfidToItem = new Map(
      itemsData.map(item => {
        const itemType = itemTypeMap.get(item.itemTypeId)
        return [item.rfidTag, { ...item, name: itemType?.name || 'Unknown Item' }]
      })
    )

    // 4. Create inventory transactions and update item status
    const transactions = []
    const { v4: uuidv4 } = await import('uuid')

    // Process BORROW actions
    for (const rfid of borrowedRfids) {
      const item = rfidToItem.get(rfid)
      if (!item) {
        console.warn(`Item not found for RFID: ${rfid}`)
        continue
      }

      // Calculate due date
      const itemType = itemTypeMap.get(item.itemTypeId)
      const borrowDuration = itemType?.maxBorrowDuration || '7 days'
      const dueAt = new Date(now)
      // Parse interval like "7 days"
      const days = parseInt(borrowDuration.split(' ')[0]) || 7
      dueAt.setDate(dueAt.getDate() + days)

      // Create transaction
      const transactionId = await db.insert(inventoryTransactions).values({
        sessionId: session_id,
        itemId: item.id,
        userId: user_id,
        actionType: 'BORROW',
        evidenceImagePath: evidence_image ? `sessions/${session_id}/evidence.jpg` : null,
        timestamp: now,
      }).returning({ id: inventoryTransactions.id })

      // Update item status
      await db.update(items)
        .set({
          status: 'BORROWED',
          currentHolderId: user_id,
          dueAt: dueAt,
          updatedAt: now,
        })
        .where(eq(items.id, item.id))

      transactions.push({
        transaction_id: transactionId[0]?.id,
        item_id: item.id,
        rfid_tag: rfid,
        action: 'BORROW',
        due_at: dueAt.toISOString(),
      })
    }

    // Process RETURN actions
    for (const rfid of returnedRfids) {
      const item = rfidToItem.get(rfid)
      if (!item) {
        console.warn(`Item not found for RFID: ${rfid}`)
        continue
      }

      // Create transaction
      const transactionId = await db.insert(inventoryTransactions).values({
        sessionId: session_id,
        itemId: item.id,
        userId: user_id,
        actionType: 'RETURN',
        evidenceImagePath: evidence_image ? `sessions/${session_id}/evidence.jpg` : null,
        timestamp: now,
      }).returning({ id: inventoryTransactions.id })

      // Update item status
      await db.update(items)
        .set({
          status: 'AVAILABLE',
          currentHolderId: null,
          dueAt: null,
          updatedAt: now,
        })
        .where(eq(items.id, item.id))

      transactions.push({
        transaction_id: transactionId[0]?.id,
        item_id: item.id,
        rfid_tag: rfid,
        action: 'RETURN',
      })
    }

    // TODO: Upload evidence image to MinIO/S3 if provided

    // 5. Send email notification to user
    try {
      // Get user info
      const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, user_id),
      })

      // Get cabinet name
      const cabinet = await db.query.locations.findFirst({
        where: eq(locations.id, cabinet_id),
      })

      if (user?.email && transactions.length > 0) {
        // Build transaction items with names
        const transactionItems = transactions.map(tx => {
          const item = rfidToItem.get(tx.rfid_tag)
          return {
            name: item?.name || `Item ${tx.rfid_tag.slice(0, 8)}...`,
            rfidTag: tx.rfid_tag,
            action: tx.action as 'BORROW' | 'RETURN',
            dueAt: tx.due_at,
          }
        })

        await sendCheckoutEmail({
          sessionId: session_id,
          userId: user_id,
          userEmail: user.email,
          userName: user.fullName || user.email,
          borrowed: transactionItems.filter(i => i.action === 'BORROW'),
          returned: transactionItems.filter(i => i.action === 'RETURN'),
          cabinetName: cabinet?.name || `Cabinet ${cabinet_id}`,
          timestamp: now,
        })
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('[SyncSession] Email notification failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      session_id,
      transactions,
      summary: {
        borrowed: borrowedRfids.length,
        returned: returnedRfids.length,
      },
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Sync session error:', error)
    const pgCode = error?.code || error?.cause?.code

    if (pgCode === '23503') {
      console.error(`[SyncSession] FK violation: cabinet_id or user_id references missing record`)
      return NextResponse.json(
        { error: 'Foreign key violation', details: 'Referenced cabinet or user not found', pgCode },
        { status: 409, headers: corsHeaders }
      )
    }
    if (pgCode === '22P02') {
      console.error(`[SyncSession] Invalid UUID format: session_id or user_id`)
      return NextResponse.json(
        { error: 'Invalid UUID format', details: String(error?.message || error), pgCode },
        { status: 400, headers: corsHeaders }
      )
    }
    if (pgCode === '23505') {
      console.error(`[SyncSession] Duplicate session: session_id already exists`)
      return NextResponse.json(
        { error: 'Duplicate session', details: 'Session already synced', pgCode },
        { status: 409, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error), pgCode: pgCode || 'unknown' },
      { status: 500, headers: corsHeaders }
    )
  }
}
