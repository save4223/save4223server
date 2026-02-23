'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'

type ItemStatus = 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE'
type Category = 'ALL' | 'TOOL' | 'DEVICE' | 'CONSUMABLE'

interface ToolItem {
  id: string
  rfidTag: string
  status: ItemStatus
  holderName: string | null
  holderEmail: string | null
  dueAt: string | null
  homeLocation: string
}

interface ToolType {
  id: number
  name: string
  category: string
  description: string | null
  imageUrl: string | null
  maxBorrowDuration: string
  items: ToolItem[]
}

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'ALL', label: 'All', icon: '🔍' },
  { key: 'TOOL', label: 'Tools', icon: '🔧' },
  { key: 'DEVICE', label: 'Devices', icon: '🔌' },
  { key: 'CONSUMABLE', label: 'Consumables', icon: '📦' },
]

function StatusBadge({ status, dueAt }: { status: ItemStatus; dueAt: string | null }) {
  const isOverdue = dueAt && new Date(dueAt) < new Date()
  
  if (status === 'AVAILABLE') {
    return <span className="badge badge-success">Available</span>
  }
  if (status === 'BORROWED') {
    return <span className={`badge ${isOverdue ? 'badge-error' : 'badge-warning'}`}>{isOverdue ? 'Overdue' : 'Borrowed'}</span>
  }
  return <span className="badge badge-neutral">{status === 'MISSING' ? 'Missing' : 'Maintenance'}</span>
}

function CategoryBadge({ category }: { category: string }) {
  const icons: Record<string, string> = { TOOL: '🔧', DEVICE: '🔌', CONSUMABLE: '📦' }
  const labels: Record<string, string> = { TOOL: 'Tool', DEVICE: 'Device', CONSUMABLE: 'Consumable' }
  
  return (
    <span className="badge badge-ghost">
      <span className="mr-1">{icons[category] || '📎'}</span>
      {labels[category] || category}
    </span>
  )
}

export default function ToolsGalleryPage() {
  const [tools, setTools] = useState<ToolType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('ALL')

  useEffect(() => {
    async function fetchTools() {
      try {
        setLoading(true)
        const res = await fetch('/api/tools')
        if (!res.ok) throw new Error('Failed to fetch tools')
        const data = await res.json()
        setTools(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchTools()
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (selectedCategory !== 'ALL' && tool.category !== selectedCategory) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = tool.name.toLowerCase().includes(query)
        const matchDesc = tool.description?.toLowerCase().includes(query)
        const matchLocation = tool.items.some(i => i.homeLocation.toLowerCase().includes(query))
        const matchRfid = tool.items.some(i => i.rfidTag.toLowerCase().includes(query))
        return matchName || matchDesc || matchLocation || matchRfid
      }
      return true
    })
  }, [tools, searchQuery, selectedCategory])

  const stats = useMemo(() => {
    const totalTypes = filteredTools.length
    const totalItems = filteredTools.reduce((sum, t) => sum + t.items.length, 0)
    const availableItems = filteredTools.reduce((sum, t) => sum + t.items.filter(i => i.status === 'AVAILABLE').length, 0)
    return { totalTypes, totalItems, availableItems }
  }, [filteredTools])

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent"></span>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-4xl">⚠️</div>
              <h2 className="card-title text-error">Failed to Load</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-accent btn-sm mt-4">Retry</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn btn-ghost btn-sm">
                ← Back
              </Link>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-accent">🔧 Tool Library</h1>
                <p className="text-accent/70 text-sm mt-1 hidden sm:block">{stats.totalTypes} types · {stats.totalItems} items · {stats.availableItems} available</p>
              </div>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <Link href="/user/items" className="btn btn-accent btn-sm">My Items</Link>
              <Link href="/tool-types" className="btn btn-ghost btn-sm hidden sm:inline-flex">Manage Types</Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search by name, description, location, or RFID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full bg-base-100"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`btn btn-sm ${selectedCategory === cat.key ? 'btn-accent' : 'btn-ghost'}`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 py-8">
        {filteredTools.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body items-center text-center py-20">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-bold mt-4">{tools.length === 0 ? 'No Tools Available' : 'No Matching Tools'}</h3>
              <p className="text-base-content/60 mt-2">{tools.length === 0 ? 'Please add tool types and items first' : 'Try adjusting your search or filter'}</p>
              {tools.length > 0 && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL') }}
                  className="btn btn-accent btn-sm mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTools.map((tool) => {
              const availableCount = tool.items.filter(i => i.status === 'AVAILABLE').length
              
              return (
                <div key={tool.id} className="card bg-base-100 shadow-md border border-base-300">
                  <div className="card-body">
                    <div className="flex items-start gap-5">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-base-200">
                        {tool.imageUrl ? (
                          <img src={tool.imageUrl} alt={tool.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">
                            {tool.category === 'TOOL' && '🔧'}
                            {tool.category === 'DEVICE' && '🔌'}
                            {tool.category === 'CONSUMABLE' && '📦'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="card-title text-xl">{tool.name}</h2>
                          <CategoryBadge category={tool.category} />
                        </div>
                        
                        <p className="text-base-content/70 mt-1 line-clamp-2">{tool.description || 'No description'}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="badge badge-success">{availableCount} Available</span>
                          <span className="badge badge-ghost">{tool.items.length} Total</span>
                          <span className="badge badge-ghost">Max {tool.maxBorrowDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-base-200 px-6 py-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-3">
                      Item List · Stored at {tool.items[0]?.homeLocation || 'N/A'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tool.items.map((item) => (
                        <div
                          key={item.id}
                          className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 bg-base-100 ${
                            item.status === 'AVAILABLE' ? 'border-success/30' : 
                            item.status === 'BORROWED' ? 'border-warning/30' : 'border-base-300'
                          }`}
                        >
                          <StatusBadge status={item.status} dueAt={item.dueAt} />
                          <span className="font-mono text-xs text-base-content/50">{item.rfidTag}</span>
                          
                          {item.status === 'BORROWED' && item.holderName && (
                            <div className="absolute bottom-full left-0 mb-2 hidden w-max max-w-xs rounded-lg bg-accent px-3 py-2 text-xs text-accent-content shadow-lg group-hover:block z-10">
                              <div>Borrower: {item.holderName}</div>
                              <div>Email: {item.holderEmail}</div>
                              <div>Due: {item.dueAt ? new Date(item.dueAt).toLocaleDateString('en-US') : '-'}</div>
                              <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-accent" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
