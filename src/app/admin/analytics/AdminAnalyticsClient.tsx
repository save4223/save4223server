'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, AlertTriangle, Package, TrendingUp, CheckCircle, XCircle, Wrench, Zap, Box } from 'lucide-react'

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

interface IssueReport {
  id: number
  reportType: string
  description: string | null
  status: string
  createdAt: string
  resolvedAt: string | null
  item: { id: string; rfidTag: string | null }
  itemType: { id: number; name: string; category: string } | null
  user: { id: string; fullName: string; email: string }
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  DIDNT_BORROW: "Didn't borrow",
  ALREADY_RETURNED: 'Already returned',
  TAG_DAMAGED: 'Tag damaged',
  TOOL_BROKEN: 'Tool broken',
  OTHER: 'Other',
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
  const [activeTab, setActiveTab] = useState<'metrics' | 'issues'>('metrics')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [issues, setIssues] = useState<IssueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, issuesRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/issues'),
        ])
        if (!analyticsRes.ok) throw new Error('Failed to load analytics')
        const analyticsData = await analyticsRes.json()
        setData(analyticsData)

        if (issuesRes.ok) {
          const issuesData = await issuesRes.json()
          setIssues(issuesData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleIssueAction(id: number, status: 'RESOLVED' | 'DISMISSED') {
    try {
      const res = await fetch(`/api/admin/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update issue')
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update issue')
    }
  }

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

  const filteredMetrics = useMemo(() => {
    if (categoryFilter === 'ALL') return metrics
    return metrics.filter(m => m.category === categoryFilter)
  }, [metrics, categoryFilter])

  const filteredSummary = useMemo(() => {
    if (categoryFilter === 'ALL') return summary
    const filtered = filteredMetrics
    return {
      totalTypes: filtered.length,
      totalItems: filtered.reduce((sum, m) => sum + m.total, 0),
      totalBorrows: filtered.reduce((sum, m) => sum + m.borrowsThisMonth, 0),
      totalWarnings: filtered.filter(m => m.isLowStock).length,
    }
  }, [filteredMetrics, summary])

  const filteredIssues = useMemo(() => {
    if (categoryFilter === 'ALL') return issues
    return issues.filter(i => i.itemType?.category === categoryFilter)
  }, [issues, categoryFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
          <BarChart3 className="w-6 h-6" /> Analytics
        </h1>
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="flex gap-1">
            {[
              { key: 'ALL', label: 'All', icon: <Package className="w-3 h-3" /> },
              { key: 'TOOL', label: 'Tools', icon: <Wrench className="w-3 h-3" /> },
              { key: 'DEVICE', label: 'Devices', icon: <Zap className="w-3 h-3" /> },
              { key: 'CONSUMABLE', label: 'Consumables', icon: <Box className="w-3 h-3" /> },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`btn btn-sm gap-1 ${categoryFilter === cat.key ? 'btn-accent' : 'btn-ghost'}`}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="join">
            <button
              className={`join-item btn btn-sm ${activeTab === 'metrics' ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </button>
            <button
              className={`join-item btn btn-sm ${activeTab === 'issues' ? 'btn-accent' : 'btn-outline'}`}
              onClick={() => setActiveTab('issues')}
            >
              Issue Reports
              {filteredIssues.filter(i => i.status === 'PENDING').length > 0 && (
                <span className="badge badge-xs badge-error">{filteredIssues.filter(i => i.status === 'PENDING').length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'metrics' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body p-4">
                <div className="text-sm text-base-content/60">Tool Types</div>
                <div className="text-3xl font-bold">{filteredSummary.totalTypes}</div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body p-4">
                <div className="text-sm text-base-content/60">Total Items</div>
                <div className="text-3xl font-bold">{filteredSummary.totalItems}</div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body p-4">
                <div className="text-sm text-base-content/60 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Borrows This Month
                </div>
                <div className="text-3xl font-bold">{filteredSummary.totalBorrows}</div>
              </div>
            </div>
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body p-4">
                <div className="text-sm text-base-content/60 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock Warnings
                </div>
                <div className="text-3xl font-bold text-warning">{filteredSummary.totalWarnings}</div>
              </div>
            </div>
          </div>

          {/* Metrics Table */}
          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body">
              <h2 className="card-title mb-4">Tool Type Metrics</h2>
              {filteredMetrics.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">No tool types for this category</div>
              ) : (
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
                      {filteredMetrics.map((m) => (
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
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'issues' && (
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body">
            <h2 className="card-title mb-4">Issue Reports</h2>
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8 text-base-content/50">No reports found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Item</th>
                      <th>Reporter</th>
                      <th className="hidden md:table-cell">Description</th>
                      <th className="hidden sm:table-cell">Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map(report => (
                      <tr key={report.id}>
                        <td>
                          <span className="badge badge-sm badge-ghost">
                            {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">{report.itemType?.name || 'Unknown'}</div>
                          <div className="font-mono text-xs text-base-content/50">{report.item.rfidTag}</div>
                        </td>
                        <td>
                          <div className="text-sm">{report.user.fullName}</div>
                          <div className="text-xs text-base-content/50">{report.user.email}</div>
                        </td>
                        <td className="hidden md:table-cell max-w-xs">
                          <div className="truncate" title={report.description || ''}>
                            {report.description || <span className="text-base-content/30">—</span>}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-sm">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge badge-sm ${
                            report.status === 'PENDING' ? 'badge-warning' :
                            report.status === 'RESOLVED' ? 'badge-success' : 'badge-ghost'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          {report.status === 'PENDING' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleIssueAction(report.id, 'RESOLVED')}
                                className="btn btn-success btn-xs"
                                title="Resolve"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleIssueAction(report.id, 'DISMISSED')}
                                className="btn btn-ghost btn-xs"
                                title="Dismiss"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-base-content/30 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
