'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  fullName: string | null
  role: 'ADMIN' | 'MANAGER' | 'USER'
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const res = await fetch('/api/user/profile')
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to load profile')
        }
        const data = await res.json()
        setProfile(data)
        setFullName(data.fullName || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })
      
      if (!res.ok) throw new Error('Save failed')
      
      const updated = await res.json()
      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent"></span>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="text-4xl">⚠️</div>
              <h2 className="card-title text-error">{error}</h2>
              <Link href="/" className="btn btn-accent btn-sm mt-4">Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-accent">👤 Profile</h1>
              <p className="text-accent/70 text-sm mt-1">Manage your personal information</p>
            </div>
            <Link href="/user/items" className="btn btn-accent btn-sm">
              My Items
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            {/* User Info Display */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-base-300">
              <div className="avatar placeholder">
                <div className="bg-accent text-accent-content rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
                  {(fullName || profile?.email || '?')[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {fullName || profile?.email}
                  {profile?.role === 'ADMIN' && (
                    <span className="badge badge-error badge-sm">ADMIN</span>
                  )}
                  {profile?.role === 'MANAGER' && (
                    <span className="badge badge-warning badge-sm">MANAGER</span>
                  )}
                </h2>
                <p className="text-base-content/60 text-sm">{profile?.email}</p>
                <p className="text-base-content/50 text-xs mt-1">
                  Joined {new Date(profile?.createdAt || '').toLocaleDateString('en-US')}
                </p>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Display Name</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="input input-bordered w-full"
                  maxLength={50}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    Other users will see this name
                  </span>
                </label>
              </div>

              {/* Email (readonly) */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input input-bordered w-full bg-base-200"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="alert alert-success mb-4">
                  <span>✅ Profile updated!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error mb-4">
                  <span>❌ {error}</span>
                </div>
              )}

              {/* Submit Button */}
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
                <Link href="/" className="btn btn-ghost">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/user/items" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold">My Items</h3>
              <p className="text-sm text-base-content/60">View borrowing history</p>
            </div>
          </Link>
          <Link href="/tools" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <div className="text-3xl mb-2">🔧</div>
              <h3 className="font-semibold">Tool Library</h3>
              <p className="text-sm text-base-content/60">Browse available tools</p>
            </div>
          </Link>
          <Link href="/user/pair-card" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <div className="text-3xl mb-2">💳</div>
              <h3 className="font-semibold">Pair NFC Card</h3>
              <p className="text-sm text-base-content/60">Link your NFC card</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
