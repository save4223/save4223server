import { NextResponse } from 'next/server'
import { db } from '@/db'
import { locations } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { checkAuth } from '@/utils/auth-helpers'

// GET /api/locations - List all locations
export async function GET() {
  // Require authentication
  const auth = await checkAuth()
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const allLocations = await db.select().from(locations)
    return NextResponse.json(allLocations)
  } catch (error) {
    console.error('Failed to fetch locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create a new location
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, type, parentId, isRestricted } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const newLocation = await db
      .insert(locations)
      .values({
        name,
        type: type || 'CABINET',
        parentId: parentId || null,
        isRestricted: isRestricted || false,
      })
      .returning()

    return NextResponse.json((newLocation as { id: number; name: string }[])[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
