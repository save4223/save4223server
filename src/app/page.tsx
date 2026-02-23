import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { sql } from 'drizzle-orm'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get statistics
  const stats = await db.select({
    totalTypes: sql<number>`count(distinct ${itemTypes.id})`,
    totalItems: sql<number>`count(${items.id})`,
    availableItems: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
  })
    .from(itemTypes)
    .leftJoin(items, sql<number>`true`)

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-accent">
            🔧 Smart Lab Inventory
          </h1>
          <p className="mb-8 text-xl text-base-content/70">Smart Lab Tool Management System</p>

          {user ? (
            <div className="flex items-center justify-center gap-4">
              <span className="badge badge-success badge-lg">
                ✅ {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="btn btn-error btn-sm"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-accent btn-lg"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/tools"
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300"
          >
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">🔧</div>
              <div className="text-3xl font-bold text-accent">
                {stats[0]?.totalTypes || 0}
              </div>
              <div className="mt-2 text-base-content/70">Tool Types</div>
              <div className="mt-4 text-sm text-accent">
                View All →
              </div>
            </div>
          </Link>

          <Link
            href="/tools"
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300"
          >
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">📦</div>
              <div className="text-3xl font-bold text-accent">
                {stats[0]?.totalItems || 0}
              </div>
              <div className="mt-2 text-base-content/70">Total Items</div>
              <div className="mt-4 text-sm text-accent">
                View All →
              </div>
            </div>
          </Link>

          <Link
            href="/tools"
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300"
          >
            <div className="card-body items-center text-center">
              <div className="text-4xl mb-4">✅</div>
              <div className="text-3xl font-bold text-accent">
                {stats[0]?.availableItems || 0}
              </div>
              <div className="mt-2 text-base-content/70">Available</div>
              <div className="mt-4 text-sm text-accent">
                Borrow Now →
              </div>
            </div>
          </Link>
        </div>

        {/* Feature Modules */}
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/tools"
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-3xl">
                🔧
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">Tool Library</h2>
                <p className="mt-2 text-base-content/70">
                  Browse all available tools, view by type, check borrowing status
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/tool-types"
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-3xl">
                📋
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">Tool Types</h2>
                <p className="mt-2 text-base-content/70">
                  Manage tool categories, set borrowing rules and return deadlines
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/user/items"
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-info text-3xl">
                📊
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">My Items</h2>
                <p className="mt-2 text-base-content/70">View currently borrowed items and transaction history</p>
              </div>
            </div>
          </Link>

          {/* <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-neutral text-3xl">
                🚪
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">Smart Cabinet</h2>
                <p className="mt-2 text-base-content/70">Manage cabinet locations and access permissions (In Development)</p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-base-content/50">
          <p>Save4223 Smart Inventory System v2.0</p>
          <p className="mt-1">Next.js + Supabase + Drizzle ORM + DaisyUI</p>
        </div>
      </div>
    </main>
  )
}
