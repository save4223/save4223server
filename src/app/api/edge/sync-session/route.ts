import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { cabinetSessions, inventoryTransactions, items, itemTypes } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

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
        { status: 401 }
      )
    }
    
    const token = authHeader.slice(7)
    if (token !== EDGE_API_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
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
        { status: 400 }
      )
    }

    // 1. Create or update cabinet session
    const now = new Date()
    
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
      })
    }

    const itemsData = await db.query.items.findMany({
      where: inArray(items.rfidTag, allRfids),
      with: {
        itemType: true,
      },
    })

    const rfidToItem = new Map(itemsData.map(item => [item.rfidTag, item]))

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
      const borrowDuration = item.itemType?.maxBorrowDuration || '7 days'
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

    return NextResponse.json({
      success: true,
      session_id,
      transactions,
      summary: {
        borrowed: borrowedRfids.length,
        returned: returnedRfids.length,
      },
    })

  } catch (error) {
    console.error('Sync session error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    )
  }
}
