'use client'

import { useState } from 'react'
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

interface NewToolPageProps {
  toolTypes: ToolType[]
  locations: Location[]
}

export default function NewToolClient({ toolTypes, locations }: NewToolPageProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    rfidTag: '',
    itemTypeId: toolTypes[0]?.id?.toString() || '',
    homeLocationId: locations[0]?.id?.toString() || '',
    status: 'AVAILABLE',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          itemTypeId: parseInt(formData.itemTypeId),
          homeLocationId: parseInt(formData.homeLocationId),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }

      router.push('/admin/tools')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
      setSaving(false)
    }
  }

  if (toolTypes.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tools" className="btn btn-ghost btn-sm">
            ← Back
          </Link>
          <h2 className="text-2xl font-bold">Add New Tool</h2>
        </div>

        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-12">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-xl font-bold mt-4">No Tool Types</h3>
            <p className="text-base-content/60 mt-2">Please create a tool type first</p>
            <Link href="/admin/tool-types/new" className="btn btn-accent mt-4">
              Create Tool Type
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tools" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h2 className="text-2xl font-bold">Add New Tool</h2>
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
              value={formData.rfidTag}
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
              value={formData.itemTypeId}
              onChange={(e) => setFormData({ ...formData, itemTypeId: e.target.value })}
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
              <span className="label-text font-semibold">Home Location *</span>
            </label>
            {locations.length > 0 ? (
              <select
                value={formData.homeLocationId}
                onChange={(e) => setFormData({ ...formData, homeLocationId: e.target.value })}
                className="select select-bordered w-full"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="alert alert-warning">
                <span>No locations available. Please create locations first.</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Status</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="select select-bordered w-full"
            >
              <option value="AVAILABLE">✅ Available</option>
              <option value="BORROWED">📤 Borrowed</option>
              <option value="MISSING">❌ Missing</option>
              <option value="MAINTENANCE">🔧 Maintenance</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>❌ {error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || locations.length === 0}
              className="btn btn-accent flex-1"
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                'Add Tool'
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
