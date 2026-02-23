'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ToolType {
  id: number
  name: string
  category: string
  description: string | null
  maxBorrowDuration: string | null
  imageUrl: string | null
}

export default function EditToolTypePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [typeId, setTypeId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<Partial<ToolType>>({
    name: '',
    category: 'TOOL',
    description: '',
    maxBorrowDuration: '7 days',
    imageUrl: '',
  })

  // Unwrap params Promise
  useEffect(() => {
    params.then(({ id }) => {
      setTypeId(parseInt(id))
    })
  }, [params])

  useEffect(() => {
    if (!typeId) return
    
    async function fetchToolType() {
      try {
        const res = await fetch(`/api/tool-types/${typeId}`)
        if (!res.ok) throw new Error('Failed to fetch tool type')
        const data = await res.json()
        setFormData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchToolType()
  }, [typeId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeId) return
    
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/tool-types/${typeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  if (loading || !typeId) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-accent"></span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tool-types" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h2 className="text-2xl font-bold">Edit Tool Type</h2>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 max-w-2xl">
        <form onSubmit={handleSubmit} className="card-body">
          {/* Name */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Name *</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input input-bordered w-full"
              required
              placeholder="e.g., Digital Multimeter"
            />
          </div>

          {/* Category */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Category *</span>
            </label>
            <select
              value={formData.category || 'TOOL'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="select select-bordered w-full"
              required
            >
              <option value="TOOL">🔧 Tool</option>
              <option value="DEVICE">🔌 Device</option>
              <option value="CONSUMABLE">📦 Consumable</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Description</span>
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="Describe this tool type..."
            />
          </div>

          {/* Max Borrow Duration */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Max Borrow Duration</span>
            </label>
            <input
              type="text"
              value={formData.maxBorrowDuration || ''}
              onChange={(e) => setFormData({ ...formData, maxBorrowDuration: e.target.value })}
              className="input input-bordered w-full"
              placeholder="e.g., 7 days, 2 weeks"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">How long users can borrow this tool</span>
            </label>
          </div>

          {/* Image URL */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Image URL</span>
            </label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="input input-bordered w-full"
              placeholder="https://example.com/image.jpg"
            />
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success mb-4">
              <span>✅ Tool type updated successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>❌ {error}</span>
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
            <Link href="/admin/tool-types" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
