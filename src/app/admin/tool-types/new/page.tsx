'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ImageInputMode = 'url' | 'upload'

export default function NewToolTypePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageMode, setImageMode] = useState<ImageInputMode>('url')
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'TOOL',
    description: '',
    maxBorrowDuration: '7 days',
    imageUrl: '',
  })

  async function handleImageUpload(file: File) {
    if (!file) return
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP')
      return
    }
    
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File too large. Max size: 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/tool-types/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { url } = await res.json()
      setFormData(prev => ({ ...prev, imageUrl: url }))
      setImageMode('url')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/tool-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }

      router.push('/admin/tool-types')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tool-types" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h2 className="text-2xl font-bold">Create New Tool Type</h2>
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
              value={formData.name}
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
              value={formData.category}
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
              value={formData.description}
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
              value={formData.maxBorrowDuration}
              onChange={(e) => setFormData({ ...formData, maxBorrowDuration: e.target.value })}
              className="input input-bordered w-full"
              placeholder="e.g., 7 days, 2 weeks"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">How long users can borrow this tool</span>
            </label>
          </div>

          {/* Image Input */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Image</span>
            </label>
            
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`btn btn-sm ${imageMode === 'url' ? 'btn-accent' : 'btn-ghost'}`}
              >
                🌐 URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`btn btn-sm ${imageMode === 'upload' ? 'btn-accent' : 'btn-ghost'}`}
              >
                📤 Upload
              </button>
            </div>

            {imageMode === 'url' && (
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input input-bordered w-full"
                placeholder="https://example.com/image.jpg"
              />
            )}

            {imageMode === 'upload' && (
              <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
                {uploading ? (
                  <div className="py-4">
                    <span className="loading loading-spinner loading-md text-accent"></span>
                    <p className="mt-2 text-sm text-base-content/60">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                      className="file-input file-input-bordered w-full"
                    />
                    <p className="mt-2 text-xs text-base-content/50">
                      Max 5MB. Supports: JPEG, PNG, GIF, WebP
                    </p>
                  </>
                )}
              </div>
            )}

            {formData.imageUrl && (
              <div className="mt-4">
                <p className="text-sm text-base-content/60 mb-2">Preview:</p>
                <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-base-200 border border-base-300">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display = 'none'
                      ;(e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="flex h-full items-center justify-center text-error text-xs">Failed to load</span>'
                    }}
                  />
                </div>
              </div>
            )}
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
              disabled={saving || uploading}
              className="btn btn-accent flex-1"
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Tool Type'
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
