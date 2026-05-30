'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, Shield, AlertCircle, CheckCircle } from 'lucide-react'

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
  itemType: ItemType
}

function parseIntervalDays(intervalStr: string | null): number {
  if (!intervalStr) return 7
  const match = intervalStr.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 7
}

export default function EditRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [requestData, setRequestData] = useState<BorrowRequest | null>(null)
  const [maxDays, setMaxDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchRequest() {
      try {
        const res = await fetch('/api/user/borrow-requests')
        if (!res.ok) throw new Error('Failed to load requests')
        const data: BorrowRequest[] = await res.json()
        const found = data.find(r => r.id === parseInt(requestId))

        if (!found) {
          setError('Request not found')
          return
        }

        if (found.status !== 'PENDING') {
          setError('This request can no longer be edited (status: ' + found.status + ')')
          return
        }

        setRequestData(found)
        setReason(found.reason)
        setStartDate(new Date(found.requestedStart).toISOString().split('T')[0])
        setEndDate(new Date(found.requestedEnd).toISOString().split('T')[0])

        // Fetch item type for max borrow duration
        const typeRes = await fetch(`/api/tool-types/${found.itemType.id}`)
        if (typeRes.ok) {
          const typeData = await typeRes.json()
          setMaxDays(parseIntervalDays(typeData.maxBorrowDuration))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchRequest()
  }, [requestId])

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!reason.trim()) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/user/borrow-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          requestedStart: startDate,
          requestedEnd: endDate,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update request')
      }
      setSuccess(true)
      setTimeout(() => {
        router.push('/user/requests')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent" />
        </div>
      </main>
    )
  }

  if (error && !requestData) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="container mx-auto px-4 py-12">
          <div className="card bg-base-200 max-w-lg mx-auto">
            <div className="card-body items-center text-center">
              <AlertCircle className="w-12 h-12 text-error mb-2" />
              <h2 className="card-title text-error">{error}</h2>
              <Link href="/user/requests" className="btn btn-accent btn-sm mt-4">Back to My Requests</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/user/requests" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Requests
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h1 className="card-title text-xl flex items-center gap-2 text-accent">
              <Shield className="w-5 h-5" /> Edit Request
            </h1>

            {requestData && (
              <div className="bg-base-200 rounded-lg p-4 mt-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <h2 className="font-bold">{requestData.itemType.name}</h2>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-ghost badge-sm">Max borrow: {maxDays} days</span>
                  <span className="badge badge-warning badge-sm">Request #{requestData.id}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="alert alert-success mt-4">
                <CheckCircle className="w-4 h-4" />
                <span>Request updated successfully!</span>
              </div>
            )}

            {error && requestData && (
              <div className="alert alert-error mt-4">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Reason for Request</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-28"
                  placeholder="Explain why you need this device..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Start Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">End Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-accent w-full"
                disabled={submitting}
              >
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
