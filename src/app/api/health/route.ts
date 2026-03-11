import { NextResponse } from 'next/server'

/**
 * GET /api/health
 *
 * Public health check endpoint.
 * Used by nginx and load balancers to verify the app is running.
 *
 * Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smart-lab-inventory'
  })
}
