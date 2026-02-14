import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userCards, locations, accessPermissions, profiles } from '@/db/schema'
import { eq, and, or, gt, isNull } from 'drizzle-orm'

const EDGE_API_SECRET = process.env.EDGE_API_SECRET || 'edge_device_secret_key'

/**
 * GET /api/edge/local-sync
 * 
 * Edge device (Raspberry Pi) polls this to cache permissions locally.
 * Enables offline authorization when server is unreachable.
 * 
 * Query Params:
 *   ?cabinet_id=1  - Optional: filter permissions for specific cabinet
 * 
 * Response:
 * {
 *   "last_updated": "2024-01-15T10:30:00Z",
 *   "users": [
 *     {
 *       "card_uid": "ABC123",
 *       "user_id": "uuid...",
 *       "user_name": "Vicky",
 *       "role": "USER",
 *       "cabinet_permissions": [1, 2]  // Cabinet IDs this user can access
 *     }
 *   ],
 *   "restricted_cabinets": [1, 3]  // Cabinet IDs that require explicit permission
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const cabinetId = searchParams.get('cabinet_id')

    // 1. Get all active user cards with user info
    const cards = await db.query.userCards.findMany({
      where: eq(userCards.isActive, true),
      with: {
        // We need to join with profiles, but drizzle-kit doesn't generate
        // relations automatically. Let's query profiles separately.
      },
    })

    // Get all profiles for lookup
    const allProfiles = await db.query.profiles.findMany()
    const profileMap = new Map(allProfiles.map(p => [p.id, p]))

    // 2. Get restricted cabinets
    const restrictedCabinets = await db.query.locations.findMany({
      where: eq(locations.isRestricted, true),
    })
    const restrictedCabinetIds = restrictedCabinets.map(c => c.id)

    // 3. Get approved permissions for restricted cabinets
    const now = new Date()
    const permissions = await db.query.accessPermissions.findMany({
      where: and(
        eq(accessPermissions.status, 'APPROVED'),
        or(
          isNull(accessPermissions.validUntil),
          gt(accessPermissions.validUntil, now)
        )
      ),
    })

    // Group permissions by user
    const userPermissions = new Map()
    for (const perm of permissions) {
      if (!userPermissions.has(perm.userId)) {
        userPermissions.set(perm.userId, [])
      }
      userPermissions.get(perm.userId).push(perm.locationId)
    }

    // 4. Build users list with permissions
    const users = cards.map(card => {
      const profile = profileMap.get(card.userId)
      
      // Default: can access non-restricted cabinets
      let cabinetPermissions = ['*'] // '*' means all non-restricted
      
      // If user has explicit permissions, add those cabinet IDs
      const userPerms = userPermissions.get(card.userId) || []
      if (userPerms.length > 0) {
        // Replace '*' with specific IDs for restricted cabinets
        cabinetPermissions = [...new Set([...cabinetPermissions, ...userPerms])]
      }

      // Filter by specific cabinet if requested
      if (cabinetId) {
        const cabId = parseInt(cabinetId)
        const canAccess = 
          !restrictedCabinetIds.includes(cabId) || 
          userPerms.includes(cabId)
        
        if (!canAccess) {
          return null // Skip this user
        }
      }

      return {
        card_uid: card.cardUid,
        user_id: card.userId,
        user_name: profile?.fullName || profile?.email || 'Unknown',
        role: profile?.role || 'USER',
        cabinet_permissions: cabinetPermissions,
        last_used_at: card.lastUsedAt?.toISOString(),
      }
    }).filter(Boolean) // Remove null entries

    return NextResponse.json({
      last_updated: now.toISOString(),
      users,
      restricted_cabinets: restrictedCabinetIds,
      total_users: users.length,
    })

  } catch (error) {
    console.error('Local sync error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
