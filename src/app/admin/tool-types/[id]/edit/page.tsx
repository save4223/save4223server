'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Check if URL is from Supabase Storage (our own uploads)
function isSupabaseStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('supabase.co') && parsed.pathname.includes('/tool-images/')
  } catch {
    return false
  }
}

// Image preview component that handles both direct and proxied URLs
function ImagePreview({ url }: { url: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <span className="flex h-full items-center justify-center text-error text-xs text-center px-2">
        Failed to load
      </span>
    )
  }

  const imageUrl = isSupabaseStorageUrl(url) ? url : `/api/image-proxy?url=${encodeURIComponent(url)}`

  return (
    <img
      src={imageUrl}
      alt="Preview"
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  )
}

interface ToolType {
  id: number
  name: string
  nameCnSimplified: string | null
  nameCnTraditional: string | null
  category: string
  description: string | null
  descriptionCn: string | null
  maxBorrowDuration: string | null
  imageUrl: string | null
}

type ImageInputMode = 'url' | 'upload'

export default function EditToolTypePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [typeId, setTypeId] = useState<number | null>(null)
  const [imageMode, setImageMode] = useState<ImageInputMode>('url')
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    nameCnSimplified: '',
    nameCnTraditional: '',
    category: 'TOOL',
    description: '',
    descriptionCn: '',
    maxBorrowDays: 7,
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
        // Parse maxBorrowDuration (e.g., "7 days") to extract days
        const daysMatch = data.maxBorrowDuration?.match(/(\d+)/)
        const maxBorrowDays = daysMatch ? parseInt(daysMatch[1]) : 7
        setFormData({
          name: data.name || '',
          nameCnSimplified: data.nameCnSimplified || '',
          nameCnTraditional: data.nameCnTraditional || '',
          category: data.category || 'TOOL',
          description: data.description || '',
          descriptionCn: data.descriptionCn || '',
          maxBorrowDays,
          imageUrl: data.imageUrl || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchToolType()
  }, [typeId])

  async function handleImageUpload(file: File) {
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, GIF, WebP')
      return
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File too large. Max size: 5MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)
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
      setImageMode('url') // Switch back to URL mode to show the uploaded URL
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

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
        body: JSON.stringify({
          name: formData.name,
          nameCnSimplified: formData.nameCnSimplified || null,
          nameCnTraditional: formData.nameCnTraditional || null,
          category: formData.category,
          description: formData.description || null,
          descriptionCn: formData.descriptionCn || null,
          maxBorrowDuration: `${formData.maxBorrowDays} days`,
          imageUrl: formData.imageUrl || null,
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

          {/* Chinese Name (Simplified) */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">中文名称 (简体)</span>
            </label>
            <input
              type="text"
              value={formData.nameCnSimplified || ''}
              onChange={(e) => setFormData({ ...formData, nameCnSimplified: e.target.value })}
              className="input input-bordered w-full"
              placeholder="例如：数字万用表"
            />
          </div>

          {/* Chinese Name (Traditional) */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">中文名稱 (繁體)</span>
            </label>
            <input
              type="text"
              value={formData.nameCnTraditional || ''}
              onChange={(e) => setFormData({ ...formData, nameCnTraditional: e.target.value })}
              className="input input-bordered w-full"
              placeholder="例如：數字萬用表"
            />
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

          {/* Chinese Description */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">中文描述</span>
            </label>
            <textarea
              value={formData.descriptionCn || ''}
              onChange={(e) => setFormData({ ...formData, descriptionCn: e.target.value })}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="描述此工具类型..."
            />
          </div>

          {/* Max Borrow Duration */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Max Borrow Days</span>
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={formData.maxBorrowDays}
              onChange={(e) => setFormData({ ...formData, maxBorrowDays: parseInt(e.target.value) || 0 })}
              className="input input-bordered w-full"
              placeholder="e.g., 7"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/50">Maximum number of days users can borrow this tool</span>
            </label>
          </div>

          {/* Image Input - Toggle between URL and Upload */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Image</span>
            </label>
            
            {/* Toggle Buttons */}
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

            {/* URL Input */}
            {imageMode === 'url' && (
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="input input-bordered w-full"
                placeholder="https://example.com/image.jpg"
              />
            )}

            {/* File Upload */}
            {imageMode === 'upload' && (
              <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
                {uploading ? (
                  <div className="py-4">
                    <span className="loading loading-spinner loading-md text-accent"></span>
                    <p className="mt-2 text-sm text-base-content/60">Uploading... {uploadProgress}%</p>
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

            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="mt-4">
                <p className="text-sm text-base-content/60 mb-2">Preview:</p>
                <div className="relative h-32 w-32 rounded-lg overflow-hidden bg-base-200 border border-base-300">
                  <ImagePreview url={formData.imageUrl} />
                </div>
                <p className="mt-2 text-xs text-base-content/50 truncate max-w-md">
                  {formData.imageUrl}
                </p>
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
              disabled={saving || uploading}
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
