'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, WrenchOff, Package } from 'lucide-react'

interface MissingItem {
  id: string
  rfidTag: string
  status: string
  updatedAt: string
  typeName: string
  typeId: number
}

export default function AdminMissingItemsClient() {
  const [items, setItems] = useState<MissingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      const res = await fetch('/api/admin/missing-items')
      if (!res.ok) throw new Error('Failed to load missing items')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'CONFIRM_AVAILABLE' | 'WRITE_OFF') {
    const label = action === 'CONFIRM_AVAILABLE' ? 'mark as available' : 'write off'
    if (!confirm(`Are you sure you want to ${label} this item?`)) return

    try {
      setProcessing(id)
      const res = await fetch(`/api/admin/missing-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      await fetchItems()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setProcessing(null)
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent flex items-center gap-2">
        <Package className="w-6 h-6" /> Missing Items
      </h1>

      {items.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-12">
            <CheckCircle className="w-12 h-12 text-success mb-4" />
            <p className="text-base-content/60">No missing items. All inventory accounted for.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="alert alert-warning">
            <AlertTriangle className="w-4 h-4" />
            <span>{items.length} item(s) flagged as MISSING. Review and confirm their status.</span>
          </div>

          <div className="card bg-base-100 shadow border border-base-300">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>RFID Tag</th>
                    <th>Missing Since</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.typeName || 'Unknown'}</div>
                      </td>
                      <td>
                        <code className="text-xs bg-base-200 px-2 py-1 rounded">{item.rfidTag}</code>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item.id, 'CONFIRM_AVAILABLE')}
                            className="btn btn-success btn-sm"
                            disabled={processing === item.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Found
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'WRITE_OFF')}
                            className="btn btn-error btn-sm btn-outline"
                            disabled={processing === item.id}
                          >
                            <WrenchOff className="w-4 h-4 mr-1" /> Write Off
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
