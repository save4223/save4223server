import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { Wrench, Package, CheckCircle, ClipboardList, LayoutDashboard, User, Sparkles } from 'lucide-react'

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
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wrench className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-bold text-accent">Smart Lab Inventory</h1>
          </div>
          <p className="mb-8 text-xl text-base-content/70">Smart Lab Tool Management System</p>

          {user ? (
            <div className="flex items-center justify-center gap-4">
              <span className="badge badge-success badge-lg">
                {user.email}
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
        <div className="mb-12 hidden gap-6 sm:grid-cols-3 sm:grid">
          <Link
            href="/tools"
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300"
          >
            <div className="card-body items-center text-center">
              <Wrench className="w-10 h-10 mb-4 text-accent" />
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
              <Package className="w-10 h-10 mb-4 text-accent" />
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
              <CheckCircle className="w-10 h-10 mb-4 text-accent" />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/user/assistant"
            className="card bg-gradient-to-br from-accent/10 to-accent/5 shadow-md hover:shadow-lg transition-all border border-accent/20 md:col-span-2 lg:col-span-3"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                <Sparkles className="w-8 h-8 text-accent-content" />
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl text-accent">AI Project Assistant</h2>
                <p className="mt-2 text-base-content/70">
                  Describe your project and get personalized tool recommendations from our inventory
                </p>
              </div>
              <div className="ml-auto">
                <span className="badge badge-accent">NEW</span>
              </div>
            </div>
          </Link>

          <Link
            href="/tools"
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                <Wrench className="w-8 h-8 text-primary-content" />
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
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                <ClipboardList className="w-8 h-8 text-secondary-content" />
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
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-info">
                <LayoutDashboard className="w-8 h-8 text-info-content" />
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">My Items</h2>
                <p className="mt-2 text-base-content/70">View currently borrowed items and transaction history</p>
              </div>
            </div>
          </Link>

          <Link
            href="/user/profile"
            className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
          >
            <div className="card-body flex flex-row items-center">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-neutral">
                <User className="w-8 h-8 text-neutral-content" />
              </div>
              <div className="ml-6">
                <h2 className="card-title text-xl">Profile</h2>
                <p className="mt-2 text-base-content/70">Manage your account settings</p>
              </div>
            </div>
          </Link>
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
