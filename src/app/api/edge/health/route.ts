import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

/**
 * GET /api/edge/health
 *
 * Health check endpoint for edge devices (Raspberry Pi).
 * Returns server status and timestamp for sync verification.
 *
 * Headers:
 *   Authorization: Bearer <EDGE_API_SECRET>
 *
 * Response:
 * {
 *   "healthy": true,
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "version": "1.0.0",
 *   "database": "connected"
 * }
 */
export async function GET(request: NextRequest) {
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

    // Check database connectivity
    let dbStatus = 'connected'
    try {
      await db.query.locations.findFirst()
    } catch (dbError) {
      dbStatus = 'disconnected'
      console.error('Database health check failed:', dbError)
    }

    return NextResponse.json({
      healthy: dbStatus === 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { healthy: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
