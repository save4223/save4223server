import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { profiles, itemTypes, items } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'
import { Wrench, Package, CheckCircle, LayoutDashboard, User, FileText, QrCode } from 'lucide-react'

// Force dynamic rendering — page content varies per user
export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Get user role
  const profile = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)
  const role = profile[0]?.role || 'USER'
  const isAdmin = role === 'ADMIN'

  // Get statistics
  const [typeCount, itemStats] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(itemTypes),
    db.select({
      totalItems: sql<number>`count(*)`,
      availableItems: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
    }).from(items),
  ])

  const stats = {
    totalTypes: typeCount[0]?.count || 0,
    totalItems: itemStats[0]?.totalItems || 0,
    availableItems: itemStats[0]?.availableItems || 0,
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Role-based navigation items — all use neutral icon background
  const navItems = isAdmin
    ? [
        { href: '/tools', icon: Wrench, label: 'Tool Library', desc: 'Browse all available tools, view by type, check borrowing status' },
        { href: '/admin/tool-types', icon: LayoutDashboard, label: 'Admin Dashboard', desc: 'Manage tool types, users, requests, and system analytics' },
        { href: '/user/signin-qr', icon: QrCode, label: 'Sign-In QR Code', desc: 'Generate QR code to sign in at the cabinet' },
        { href: '/user/profile', icon: User, label: 'Profile', desc: 'Manage your account settings' },
      ]
    : [
        { href: '/tools', icon: Wrench, label: 'Tool Library', desc: 'Browse all available tools, view by type, check borrowing status' },
        { href: '/user/items', icon: Package, label: 'My Items', desc: 'View currently borrowed items and transaction history' },
        { href: '/user/requests', icon: FileText, label: 'My Requests', desc: 'View and manage your device borrow requests' },
        { href: '/user/signin-qr', icon: QrCode, label: 'Sign-In QR Code', desc: 'Generate QR code to sign in at the cabinet' },
        { href: '/user/profile', icon: User, label: 'Profile', desc: 'Manage your account settings' },
      ]

  return (
    <main className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wrench className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-bold text-accent">ISDWorks!</h1>
          </div>
          <p className="mb-8 text-xl text-base-content/70">Inventory Management System</p>

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

        {/* Statistics — compact row on mobile, original cards on desktop */}
        {/* Mobile: horizontal chips */}
        <div className="mb-12 flex gap-4 justify-center sm:hidden">
          <div className="flex flex-col items-center bg-base-100 shadow border border-base-300 rounded-lg px-5 py-3">
            <span className="text-2xl font-bold text-accent">{stats.totalTypes}</span>
            <span className="text-xs text-base-content/60">Tool Types</span>
          </div>
          <div className="flex flex-col items-center bg-base-100 shadow border border-base-300 rounded-lg px-5 py-3">
            <span className="text-2xl font-bold text-accent">{stats.totalItems}</span>
            <span className="text-xs text-base-content/60">Total Items</span>
          </div>
          <div className="flex flex-col items-center bg-base-100 shadow border border-base-300 rounded-lg px-5 py-3">
            <span className="text-2xl font-bold text-accent">{stats.availableItems}</span>
            <span className="text-xs text-base-content/60">Available</span>
          </div>
        </div>
        {/* Desktop: original cards */}
        <div className="mb-12 hidden sm:grid sm:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300">
            <div className="card-body items-center text-center">
              <Wrench className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.totalTypes}</div>
              <div className="mt-2 text-base-content/70">Tool Types</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300">
            <div className="card-body items-center text-center">
              <Package className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.totalItems}</div>
              <div className="mt-2 text-base-content/70">Total Items</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-base-300">
            <div className="card-body items-center text-center">
              <CheckCircle className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.availableItems}</div>
              <div className="mt-2 text-base-content/70">Available</div>
            </div>
          </div>
        </div>

        {/* Feature Modules — full-width buttons, role-based */}
        <div className="flex flex-col gap-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="card bg-base-100 shadow-md hover:shadow-lg transition-all border border-base-300"
              >
                <div className="card-body flex flex-row items-center py-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral">
                    <Icon className="w-6 h-6 text-neutral-content" />
                  </div>
                  <div className="ml-4">
                    <h2 className="card-title text-lg">{item.label}</h2>
                    <p className="text-sm text-base-content/60">{item.desc}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
