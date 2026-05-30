'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Edit, XCircle, AlertTriangle, Clock } from 'lucide-react'

interface ItemType {
  id: number
  name: string
  nameCnSimplified: string | null
  category: string
}

interface BorrowRequest {
  id: number
  reason: string
  requestedStart: string
  requestedEnd: string
  status: string
  adminReviewReason: string | null
  reviewedAt: string | null
  createdAt: string
  itemType: ItemType
}

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
  EXPIRED: 'badge-ghost',
  CANCELLED: 'badge-neutral',
}

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const res = await fetch('/api/user/borrow-requests')
      if (!res.ok) throw new Error('Failed to load requests')
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const res = await fetch(`/api/user/borrow-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel')
      }
      await fetchRequests()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const filtered = filter === 'ALL'
    ? requests
    : requests.filter(r => r.status === filter)

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-accent flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6" /> My Requests
        </h1>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-accent' : 'btn-ghost'}`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'ALL' && (
                <span className="badge badge-sm">{requests.filter(r => r.status === f).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Request List */}
        {error ? (
          <div className="alert alert-error">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body items-center text-center py-12">
              <FileText className="w-12 h-12 text-base-content/30 mb-4" />
              <p className="text-base-content/60">No requests found</p>
              <Link href="/tools" className="btn btn-accent btn-sm mt-4">Browse Devices</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req.id} className="card bg-base-100 shadow border border-base-300">
                <div className="card-body p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{req.itemType.name}</h3>
                        <span className={`badge ${STATUS_BADGE[req.status] || 'badge-ghost'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 truncate">{req.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.requestedStart).toLocaleDateString()} — {new Date(req.requestedEnd).toLocaleDateString()}
                        </span>
                        <span>Submitted {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      {req.adminReviewReason && (
                        <div className="mt-2 text-sm">
                          <span className={`font-medium ${req.status === 'APPROVED' ? 'text-success' : req.status === 'REJECTED' ? 'text-error' : 'text-base-content/60'}`}>
                            Admin: {req.adminReviewReason}
                          </span>
                        </div>
                      )}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Link
                          href={`/user/requests/${req.id}/edit`}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Link>
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="btn btn-error btn-sm btn-outline"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
                        </button>
                      </div>
                    )}
                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="btn btn-error btn-sm btn-outline flex-shrink-0"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
