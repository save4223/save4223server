import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { itemTypes } from '@/db/schema'
import { createClient } from '@/utils/supabase/server'
import { sql, eq } from 'drizzle-orm'

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

  // Get all tool types
  const types = await db.select().from(itemTypes).orderBy(itemTypes.name)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Tool Types</h2>
        <Link href="/admin/tool-types/new" className="btn btn-accent">
          + Create New Type
        </Link>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Max Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id}>
                  <td>{type.id}</td>
                  <td>
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
                      {type.imageUrl ? (
                        <img src={type.imageUrl} alt={type.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl">
                          {type.category === 'TOOL' && '🔧'}
                          {type.category === 'DEVICE' && '🔌'}
                          {type.category === 'CONSUMABLE' && '📦'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{type.name}</td>
                  <td><span className="badge badge-ghost">{type.category}</span></td>
                  <td>{type.maxBorrowDuration || '7 days'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/tool-types/${type.id}/edit`}
                        className="btn btn-warning btn-sm"
                      >
                        ✏️ Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {types.length === 0 && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body items-center text-center py-12">
            <div className="text-6xl">📦</div>
            <h3 className="text-xl font-bold mt-4">No Tool Types</h3>
            <p className="text-base-content/60 mt-2">Create your first tool type to get started</p>
            <Link href="/admin/tool-types/new" className="btn btn-accent mt-4">
              + Create New Type
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
