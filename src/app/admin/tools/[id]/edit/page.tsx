'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ToolType {
  id: number
  name: string
}

interface Location {
  id: number
  name: string
}

interface Tool {
  id: string
  rfidTag: string
  itemTypeId: number
  homeLocationId: number | null
  status: string
  currentHolderId: string | null
}

export default function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [toolId, setToolId] = useState<string | null>(null)

  const [toolTypes, setToolTypes] = useState<ToolType[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const [formData, setFormData] = useState<Partial<Tool>>({
    rfidTag: '',
    itemTypeId: undefined,
    homeLocationId: null,
    status: 'AVAILABLE',
    currentHolderId: null,
  })

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setToolId(id)
    })
  }, [params])

  // Fetch tool data and options
  useEffect(() => {
    if (!toolId) return

    async function fetchData() {
      try {
        // Fetch tool, tool types, and locations in parallel
        const [toolRes, typesRes, locationsRes] = await Promise.all([
          fetch(`/api/items/${toolId}`),
          fetch('/api/tool-types'),
          fetch('/api/locations'),
        ])

        if (!toolRes.ok) throw new Error('Failed to fetch tool')
        if (!typesRes.ok) throw new Error('Failed to fetch tool types')
        if (!locationsRes.ok) throw new Error('Failed to fetch locations')

        const [toolData, typesData, locationsData] = await Promise.all([
          toolRes.json(),
          typesRes.json(),
          locationsRes.json(),
        ])

        setFormData({
          rfidTag: toolData.rfidTag,
          itemTypeId: toolData.itemTypeId,
          homeLocationId: toolData.homeLocationId,
          status: toolData.status,
          currentHolderId: toolData.currentHolderId,
        })
        setToolTypes(typesData)
        setLocations(locationsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toolId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!toolId) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/items/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfidTag: formData.rfidTag,
          itemTypeId: formData.itemTypeId,
          homeLocationId: formData.homeLocationId,
          status: formData.status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !toolId) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-accent"></span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tools" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h2 className="text-2xl font-bold">Edit Tool</h2>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 max-w-2xl">
        <form onSubmit={handleSubmit} className="card-body">
          {/* RFID Tag */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">RFID Tag *</span>
            </label>
            <input
              type="text"
              value={formData.rfidTag || ''}
              onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
              className="input input-bordered w-full"
              required
              placeholder="e.g., RFID-OSC-001"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">Unique identifier for this tool</span>
            </label>
          </div>

          {/* Tool Type */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Tool Type *</span>
            </label>
            <select
              value={formData.itemTypeId || ''}
              onChange={(e) => setFormData({ ...formData, itemTypeId: parseInt(e.target.value) })}
              className="select select-bordered w-full"
              required
            >
              {toolTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Home Location */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Home Location</span>
            </label>
            <select
              value={formData.homeLocationId || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  homeLocationId: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="select select-bordered w-full"
            >
              <option value="">-- Not assigned --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Status</span>
            </label>
            <select
              value={formData.status || 'AVAILABLE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="select select-bordered w-full"
            >
              <option value="AVAILABLE">Available</option>
              <option value="BORROWED">Borrowed</option>
              <option value="MISSING">Missing</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success mb-4">
              <span>Tool updated successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-accent flex-1"
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link href="/admin/tools" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
