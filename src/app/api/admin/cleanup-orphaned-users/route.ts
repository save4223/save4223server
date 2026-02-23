import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { db } from '@/db'
import { profiles, items } from '@/db/schema'
import { sql, eq, not, inArray } from 'drizzle-orm'

// POST /api/admin/cleanup-orphaned-users - Clean up profiles without auth users
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const profile = await db.select({ role: sql`role` }).from(sql`profiles`).where(eq(sql`id`, user.id)).limit(1)
    if (profile[0]?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all profiles
    const allProfiles = await db.select().from(profiles)
    
    // Check each profile against auth.users
    const orphanedProfiles: typeof allProfiles = []
    const validProfiles: typeof allProfiles = []
    
    for (const profile of allProfiles) {
      const { data: authUser, error } = await serviceClient.auth.admin.getUserById(profile.id)
      
      if (error || !authUser.user) {
        orphanedProfiles.push(profile)
      } else {
        validProfiles.push(profile)
      }
    }

    if (orphanedProfiles.length === 0) {
      return NextResponse.json({
        message: 'No orphaned profiles found',
        cleaned: 0,
        itemsReset: 0,
      })
    }

    const orphanedIds = orphanedProfiles.map(p => p.id)

    // Find items borrowed by orphaned users
    const borrowedItems = await db
      .select({ id: items.id, rfidTag: items.rfidTag, currentHolderId: items.currentHolderId })
      .from(items)
      .where(eq(items.status, 'BORROWED'))

    const orphanedBorrowedItems = borrowedItems.filter(item => 
      orphanedIds.includes(item.currentHolderId || '')
    )

    // Reset borrowed items to AVAILABLE
    let itemsReset = 0
    if (orphanedBorrowedItems.length > 0) {
      const itemIds = orphanedBorrowedItems.map(item => item.id)
      
      await db.update(items)
        .set({
          status: 'AVAILABLE',
          currentHolderId: null,
          dueAt: null,
        })
        .where(inArray(items.id, itemIds))
      
      itemsReset = orphanedBorrowedItems.length
    }

    // Delete orphaned profiles
    await db.delete(profiles).where(inArray(profiles.id, orphanedIds))

    return NextResponse.json({
      message: `Cleaned up ${orphanedProfiles.length} orphaned profile(s)`,
      cleaned: orphanedProfiles.length,
      itemsReset: itemsReset,
      orphanedUsers: orphanedProfiles.map(p => ({
        id: p.id,
        email: p.email,
        fullName: p.fullName,
      })),
      resetItems: orphanedBorrowedItems.map(item => ({
        id: item.id,
        rfidTag: item.rfidTag,
      })),
    })
  } catch (error) {
    console.error('Failed to cleanup orphaned users:', error)
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
  }
}

// GET /api/admin/cleanup-orphaned-users - Preview orphaned users without deleting
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const profile = await db.select({ role: sql`role` }).from(sql`profiles`).where(eq(sql`id`, user.id)).limit(1)
    if (profile[0]?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all profiles
    const allProfiles = await db.select().from(profiles)
    
    // Check each profile against auth.users
    const orphanedProfiles: typeof allProfiles = []
    
    for (const profile of allProfiles) {
      const { data: authUser, error } = await serviceClient.auth.admin.getUserById(profile.id)
      
      if (error || !authUser.user) {
        orphanedProfiles.push(profile)
      }
    }

    // Find items borrowed by orphaned users
    const orphanedIds = orphanedProfiles.map(p => p.id)
    
    const borrowedItems = await db
      .select({ id: items.id, rfidTag: items.rfidTag, currentHolderId: items.currentHolderId })
      .from(items)
      .where(eq(items.status, 'BORROWED'))

    const orphanedBorrowedItems = borrowedItems.filter(item => 
      orphanedIds.includes(item.currentHolderId || '')
    )

    return NextResponse.json({
      orphanedCount: orphanedProfiles.length,
      orphanedUsers: orphanedProfiles.map(p => ({
        id: p.id,
        email: p.email,
        fullName: p.fullName,
      })),
      borrowedItemsCount: orphanedBorrowedItems.length,
      borrowedItems: orphanedBorrowedItems.map(item => ({
        id: item.id,
        rfidTag: item.rfidTag,
      })),
    })
  } catch (error) {
    console.error('Failed to preview orphaned users:', error)
    return NextResponse.json({ error: 'Failed to preview' }, { status: 500 })
  }
}
