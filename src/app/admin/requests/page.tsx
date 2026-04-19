import { redirect } from 'next/navigation'
import { db } from '@/db'
import { sql, eq } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'
import AdminRequestsClient from './AdminRequestsClient'

export default async function AdminRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await db.select({ role: sql`role` }).from(sql`profiles`).where(eq(sql`id`, user.id)).limit(1)
  if (profile[0]?.role !== 'ADMIN') {
    redirect('/')
  }

  return <AdminRequestsClient />
}
