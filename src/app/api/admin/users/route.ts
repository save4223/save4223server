import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { sql, eq, desc } from 'drizzle-orm'

// GET /api/admin/users - List all users
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

    // Get all users
    const users = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/admin/users/invite - Invite a new user
export async function POST(request: Request) {
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

    const body = await request.json()
    const { email, role = 'USER' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create service role client for admin operations
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create user with service role
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: crypto.randomUUID(), // Random temporary password
      email_confirm: true,
      user_metadata: { role },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Update profile role
    if (newUser.user) {
      await db.update(profiles)
        .set({ role: role as 'ADMIN' | 'MANAGER' | 'USER' })
        .where(eq(profiles.id, newUser.user.id))
    }

    // Send password reset email so user can set their own password
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    return NextResponse.json({ 
      success: true, 
      user: newUser.user,
      message: 'User invited successfully. They will receive a password reset email.'
    })
  } catch (error) {
    console.error('Failed to invite user:', error)
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })
  }
}
