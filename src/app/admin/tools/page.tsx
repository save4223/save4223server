import { redirect } from 'next/navigation'
import { db } from '@/db'
import { items, itemTypes, locations, profiles } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { sql, eq } from 'drizzle-orm'
import AdminToolsClient from './AdminToolsClient'

export default async function AdminToolsPage() {
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

  // Get all tools with their details
  const allItems = await db
    .select({
      item: items,
      type: itemTypes,
      location: locations,
      holder: profiles,
    })
    .from(items)
    .leftJoin(itemTypes, eq(items.itemTypeId, itemTypes.id))
    .leftJoin(locations, eq(items.homeLocationId, locations.id))
    .leftJoin(profiles, eq(items.currentHolderId, profiles.id))
    .orderBy(items.rfidTag)

  const tools = allItems.map(({ item, type, location, holder }) => ({
    id: item.id,
    rfidTag: item.rfidTag,
    status: item.status,
    itemTypeId: item.itemTypeId,
    itemTypeName: type?.name || 'Unknown',
    homeLocation: location?.name || 'Unknown',
    holderName: holder?.fullName || null,
  }))

  // Get tool types for the create form
  const toolTypes = await db.select({
    id: itemTypes.id,
    name: itemTypes.name,
  }).from(itemTypes).orderBy(itemTypes.name)

  return <AdminToolsClient tools={tools} toolTypes={toolTypes} />
}
