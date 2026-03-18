import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { sql, eq } from 'drizzle-orm'

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER'

export interface AuthResult {
  authorized: boolean
  user?: { id: string; email?: string }
  role?: UserRole
  error?: NextResponse
}

/**
 * Check if request is authenticated and optionally verify role
 */
export async function checkAuth(requireRole?: UserRole): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    // Get user role from profiles table
    const profile = await db
      .select({ role: sql<UserRole>`role` })
      .from(sql`profiles`)
      .where(eq(sql`id`, user.id))
      .limit(1)

    const role = profile[0]?.role || 'USER'

    // Check role if required
    if (requireRole === 'ADMIN' && role !== 'ADMIN') {
      return {
        authorized: false,
        user: { id: user.id, email: user.email },
        role,
        error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
      }
    }

    if (requireRole === 'MANAGER' && role !== 'ADMIN' && role !== 'MANAGER') {
      return {
        authorized: false,
        user: { id: user.id, email: user.email },
        role,
        error: NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 }),
      }
    }

    return {
      authorized: true,
      user: { id: user.id, email: user.email },
      role,
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    }
  }
}
