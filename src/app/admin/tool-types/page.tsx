import { redirect } from 'next/navigation'
import { db } from '@/db'
import { itemTypes, locations } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { sql, eq } from 'drizzle-orm'
import AdminToolTypesClient from './AdminToolTypesClient'

export default async function AdminToolTypesPage() {
  // Check admin access
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if admin
  const profile = await db.select({ role: sql`role` }).from(sql`profiles`).where(eq(sql`id`, user.id)).limit(1)
  if (profile[0]?.role !== 'ADMIN') {
    redirect('/')
  }

  // Get all tool types and locations
  const [types, allLocations] = await Promise.all([
    db.select().from(itemTypes).orderBy(itemTypes.name),
    db.select({ id: locations.id, name: locations.name }).from(locations).orderBy(locations.name),
  ])

  return <AdminToolTypesClient types={types} locations={allLocations} />
}
