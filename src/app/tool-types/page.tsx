import Link from 'next/link'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { eq, sql, count } from 'drizzle-orm'

export default async function ToolTypesPage() {
  // Get all tool types first
  const allTypes = await db.select().from(itemTypes)
  
  // Get stats for each type separately to ensure correct counts
  const typesWithStats = await Promise.all(
    allTypes.map(async (type) => {
      const stats = await db.select({
        total: count(items.id),
        available: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
      })
      .from(items)
      .where(eq(items.itemTypeId, type.id))
      
      return {
        type,
        total: stats[0]?.total || 0,
        available: stats[0]?.available || 0,
      }
    })
  )

  // Calculate totals
  const totalTypes = typesWithStats.length
  const totalItems = typesWithStats.reduce((sum, t) => sum + t.total, 0)
  const totalAvailable = typesWithStats.reduce((sum, t) => sum + t.available, 0)

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header - DaisyUI style matching tools page */}
      <div className="bg-primary shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/tools"
                className="btn btn-ghost btn-sm"
              >
                ← Back to Tools
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-accent">📋 Tool Types</h1>
                <p className="text-accent/70 text-sm mt-1">Manage tool categories and borrowing rules</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview - DaisyUI cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-3xl font-bold text-accent">{totalTypes}</div>
              <div className="mt-2 text-base-content/70">Total Tool Types</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">✅</div>
              <div className="text-3xl font-bold text-success">{totalAvailable}</div>
              <div className="mt-2 text-base-content/70">Available Tools</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📦</div>
              <div className="text-3xl font-bold text-info">{totalItems}</div>
              <div className="mt-2 text-base-content/70">Total Tool Items</div>
            </div>
          </div>
        </div>

        {/* Type List - DaisyUI table style */}
        <div className="mt-8 card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <tr>
                  <th className="text-left">Image</th>
                  <th className="text-left">Type Name</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Max Duration</th>
                  <th className="text-left">Total Items</th>
                  <th className="text-left">Available</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {typesWithStats.map(({ type, total, available }) => (
                  <tr key={type.id} className="hover:bg-base-200/50">
                    <td className="whitespace-nowrap">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-base-200 flex items-center justify-center">
                        {type.imageUrl ? (
                          <img src={type.imageUrl} alt={type.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl">
                            {type.category === 'TOOL' && '🔧'}
                            {type.category === 'DEVICE' && '🔌'}
                            {type.category === 'CONSUMABLE' && '📦'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-base">{type.name}</span>
                        <span className="text-sm text-base-content/60 line-clamp-1 max-w-xs">
                          {type.description || 'No description'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-ghost">
                        {type.category}
                      </span>
                    </td>
                    <td className="text-base-content/70">
                      {type.maxBorrowDuration || '7 days'}
                    </td>
                    <td>
                      <span className="font-semibold">{total}</span>
                    </td>
                    <td>
                      <span className={`badge ${available > 0 ? 'badge-success' : 'badge-ghost'}`}>
                        {available}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/tools?type=${type.id}`}
                        className="btn btn-accent btn-sm"
                      >
                        View Tools
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State - DaisyUI style */}
        {typesWithStats.length === 0 && (
          <div className="mt-8 card bg-base-200">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl">📦</div>
              <h3 className="text-xl font-bold mt-4">No Tool Types</h3>
              <p className="text-base-content/60 mt-2">Please create tool types first</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
