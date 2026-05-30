'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Wrench, Package, Trash2, Info } from 'lucide-react'

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
    const msg = action === 'CONFIRM_AVAILABLE'
      ? 'Mark this item as FOUND?\n\nThe item will be set back to AVAILABLE and can be borrowed again. The current holder and due date will be cleared.'
      : 'Write off this item?\n\nThe item will be set to MAINTENANCE status and removed from circulation. The current holder and due date will be cleared.'
    if (!confirm(msg)) return

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(
      `Permanently DELETE "${name}" from the system?\n\n` +
      `This will remove the item and all its transaction history. This cannot be undone.`
    )) return

    try {
      setProcessing(id)
      const res = await fetch(`/api/admin/missing-items/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
      await fetchItems()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
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

      {/* Info card explaining how items get here and what actions do */}
      <div className="card bg-info/10 border border-info/20">
        <div className="card-body p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-info">How do items end up here?</p>
              <p className="text-base-content/70">
                When a user closes the cabinet, the RFID scanner takes an inventory snapshot.
                If an item that was previously in the cabinet is no longer detected, it gets flagged as <strong>MISSING</strong>.
              </p>
              <div className="divider my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="font-medium text-success">✓ Found</p>
                  <p className="text-base-content/60">Item is back in the cabinet. Sets status to <code className="bg-base-200 px-1 rounded text-xs">AVAILABLE</code> — ready to borrow again.</p>
                </div>
                <div>
                  <p className="font-medium text-warning">🔧 Write Off</p>
                  <p className="text-base-content/60">Item is damaged or needs repair. Sets status to <code className="bg-base-200 px-1 rounded text-xs">MAINTENANCE</code> — removed from circulation but kept in records.</p>
                </div>
                <div>
                  <p className="font-medium text-error">🗑️ Delete</p>
                  <p className="text-base-content/60">Permanently remove the item from the system. Use when the item has been gone for a long time or is confirmed lost. This cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleAction(item.id, 'CONFIRM_AVAILABLE')}
                            className="btn btn-success btn-sm"
                            disabled={processing === item.id}
                            title="Item is back in the cabinet. Sets status to AVAILABLE."
                          >
                            <CheckCircle className="w-4 h-4" /> Found
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'WRITE_OFF')}
                            className="btn btn-warning btn-sm btn-outline"
                            disabled={processing === item.id}
                            title="Item is damaged/needs repair. Sets status to MAINTENANCE (out of circulation)."
                          >
                            <Wrench className="w-4 h-4" /> Write Off
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.typeName || 'Unknown')}
                            className="btn btn-error btn-sm btn-outline"
                            disabled={processing === item.id}
                            title="Permanently remove from system. Cannot be undone."
                          >
                            <Trash2 className="w-4 h-4" /> Delete
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
