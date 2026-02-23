import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/users/[id] - Update user role
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['ADMIN', 'MANAGER', 'USER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent self-demotion from admin
    if (id === user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 400 })
    }

    // Update profile role
    await db.update(profiles)
      .set({ role: role as 'ADMIN' | 'MANAGER' | 'USER' })
      .where(eq(profiles.id, id))

    return NextResponse.json({ success: true, message: 'Role updated successfully' })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Create service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete user from auth
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
