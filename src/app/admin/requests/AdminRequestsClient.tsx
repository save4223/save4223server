'use client'

import { useState, useEffect } from 'react'
import { FileText, Check, X, AlertTriangle } from 'lucide-react'

interface ItemType {
  id: number
  name: string
  nameCnSimplified: string | null
  category: string
}

interface BorrowRequest {
  id: number
  userId: string
  userFullName: string
  userEmail: string
  itemTypeId: number
  itemType: ItemType
  reason: string
  requestedStart: string
  requestedEnd: string
  status: string
  adminReviewReason: string | null
  reviewedAt: string | null
  createdAt: string
}

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  REJECTED: 'badge-error',
  EXPIRED: 'badge-ghost',
  CANCELLED: 'badge-neutral',
}

export default function AdminRequestsClient() {
  const [requests, setRequests] = useState<BorrowRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const res = await fetch('/api/admin/requests')
      if (!res.ok) throw new Error('Failed to load requests')
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: number, action: 'APPROVE' | 'REJECT') {
    const reason = action === 'REJECT' ? rejectReason : ''
    if (action === 'REJECT' && !reason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      setProcessing(true)
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      })
      if (!res.ok) throw new Error('Failed to update request')
      setRejectingId(null)
      setRejectReason('')
      await fetchRequests()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setProcessing(false)
    }
  }

  const filtered = filter === 'ALL'
    ? requests
    : requests.filter(r => r.status === filter)

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
        <FileText className="w-6 h-6" /> Borrow Requests
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterType[]).map(f => (
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

      {/* Requests Table */}
      {filtered.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-12">
            <FileText className="w-12 h-12 text-base-content/30 mb-4" />
            <p className="text-base-content/60">No requests found</p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Device</th>
                  <th className="hidden md:table-cell">Reason</th>
                  <th className="hidden sm:table-cell">Date Range</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div className="font-medium">{req.userFullName}</div>
                      <div className="text-xs text-base-content/50">{req.userEmail}</div>
                    </td>
                    <td>
                      <div>{req.itemType.name}</div>
                      <span className="badge badge-ghost badge-xs">{req.itemType.category}</span>
                    </td>
                    <td className="hidden md:table-cell max-w-xs">
                      <div className="truncate" title={req.reason}>{req.reason}</div>
                    </td>
                    <td className="hidden sm:table-cell text-sm">
                      {new Date(req.requestedStart).toLocaleDateString()} — {new Date(req.requestedEnd).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[req.status] || 'badge-ghost'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'PENDING' ? (
                        rejectingId === req.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="input input-bordered input-sm input-error w-32"
                              placeholder="Rejection reason"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <button
                              onClick={() => handleAction(req.id, 'REJECT')}
                              className="btn btn-error btn-sm"
                              disabled={processing}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason('') }}
                              className="btn btn-ghost btn-sm"
                              disabled={processing}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(req.id, 'APPROVE')}
                              className="btn btn-success btn-sm"
                              disabled={processing}
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(req.id)}
                              className="btn btn-error btn-sm"
                              disabled={processing}
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </button>
                          </div>
                        )
                      ) : req.adminReviewReason ? (
                        <div className="text-xs text-base-content/50 max-w-xs truncate" title={req.adminReviewReason}>
                          {req.adminReviewReason}
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
        </div>
      )}
    </div>
  )
}
