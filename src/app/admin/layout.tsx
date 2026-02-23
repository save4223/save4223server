'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tool-types', label: 'Tool Types', icon: '📋' },
  { href: '/admin/tools', label: 'Tools', icon: '🔧' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top Navigation */}
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn btn-accent btn-sm">
                ← Back to Home
              </Link>
              <h1 className="text-xl font-bold text-accent">⚙️ Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/user/profile" className="btn btn-ghost btn-sm">
                👤 Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <nav className="card bg-base-100 shadow border border-base-300">
              <ul className="menu p-4">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
