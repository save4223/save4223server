'use client'

import { useState, useEffect } from 'react'
import { BarChart3, AlertTriangle, Package, TrendingUp } from 'lucide-react'

interface MetricData {
  id: number
  name: string
  nameCnSimplified: string | null
  nameCnTraditional: string | null
  category: string
  total: number
  available: number
  availabilityPercent: number
  borrowsThisMonth: number
  overdueRate: number
  damageReportsThisMonth: number
  isLowStock: boolean
  minThreshold: number
  currentStock: number
}

interface AnalyticsData {
  metrics: MetricData[]
  summary: {
    totalTypes: number
    totalItems: number
    totalBorrows: number
    totalWarnings: number
  }
}

function AvailabilityBar({ percent }: { percent: number }) {
  const color = percent >= 75 ? 'bg-success' : percent >= 50 ? 'bg-warning' : 'bg-error'
  return (
    <div className="flex items-center gap-2">
      <progress className={`progress progress-xs w-20 ${color}`} value={percent} max={100} />
      <span className="text-sm font-mono">{percent}%</span>
    </div>
  )
}

export default function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/analytics')
        if (!res.ok) throw new Error('Failed to load analytics')
        const result = await res.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )
  }

  const metrics = data?.metrics || []
  const summary = data?.summary || { totalTypes: 0, totalItems: 0, totalBorrows: 0, totalWarnings: 0 }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
        <BarChart3 className="w-6 h-6" /> Analytics
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="text-sm text-base-content/60">Tool Types</div>
            <div className="text-3xl font-bold">{summary.totalTypes}</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="text-sm text-base-content/60">Total Items</div>
            <div className="text-3xl font-bold">{summary.totalItems}</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="text-sm text-base-content/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Borrows This Month
            </div>
            <div className="text-3xl font-bold">{summary.totalBorrows}</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body p-4">
            <div className="text-sm text-base-content/60 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low Stock Warnings
            </div>
            <div className="text-3xl font-bold text-warning">{summary.totalWarnings}</div>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="card bg-base-100 shadow border border-base-300">
        <div className="card-body">
          <h2 className="card-title mb-4">Tool Type Metrics</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Tool Type</th>
                  <th>Availability</th>
                  <th className="hidden sm:table-cell">Available / Total</th>
                  <th>Borrows/Mo</th>
                  <th className="hidden md:table-cell">Overdue Rate</th>
                  <th className="hidden lg:table-cell">Damage Reports</th>
                  <th>Low Stock</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className={m.isLowStock ? 'bg-warning/10' : ''}>
                    <td>
                      <div className="font-medium">{m.name}</div>
                      <span className="badge badge-ghost badge-xs">{m.category}</span>
                    </td>
                    <td><AvailabilityBar percent={m.availabilityPercent} /></td>
                    <td className="hidden sm:table-cell font-mono text-sm">{m.available} / {m.total}</td>
                    <td className="font-semibold">{m.borrowsThisMonth}</td>
                    <td className="hidden md:table-cell">
                      <span className={m.overdueRate > 0 ? 'text-error font-semibold' : 'text-base-content/60'}>
                        {m.overdueRate}%
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">{m.damageReportsThisMonth}</td>
                    <td>
                      {m.isLowStock ? (
                        <span className="badge badge-warning badge-sm flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          &lt;{m.minThreshold}
                        </span>
                      ) : (
                        <span className="text-base-content/40 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
