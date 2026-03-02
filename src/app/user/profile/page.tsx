'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, ArrowLeft, Package, CreditCard, Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Profile {
  id: string
  email: string
  fullName: string | null
  role: 'ADMIN' | 'MANAGER' | 'USER'
  createdAt: string
}

function RoleBadge({ role }: { role: string }) {
  const configs = {
    ADMIN: { class: 'badge-error', label: 'Admin' },
    MANAGER: { class: 'badge-warning', label: 'Manager' },
    USER: { class: 'badge-ghost', label: 'User' },
  }
  const config = configs[role as keyof typeof configs] || configs.USER
  
  return <span className={`badge ${config.class} badge-sm`}>{config.label}</span>
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
              <AlertCircle className="w-12 h-12 text-error mb-2" />
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
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/" className="btn btn-ghost btn-sm w-fit">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-accent" />
                <h1 className="text-xl sm:text-2xl font-bold text-accent">Profile</h1>
              </div>
              <Link href="/user/items" className="btn btn-accent btn-sm">
                My Items
              </Link>
            </div>
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
                <div className="bg-accent text-accent-content rounded-full w-16 h-16 flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {fullName || profile?.email}
                  <RoleBadge role={profile?.role || 'USER'} />
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
                  <CheckCircle className="w-5 h-5" />
                  <span>Profile updated!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="alert alert-error mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
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
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {profile?.role === 'ADMIN' && (
            <Link href="/admin" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
              <div className="card-body items-center text-center py-6">
                <Settings className="w-8 h-8 mb-2 text-accent" />
                <h3 className="font-semibold">Admin Dashboard</h3>
                <p className="text-sm text-base-content/60">Manage system</p>
              </div>
            </Link>
          )}
          
          <Link href="/user/items" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <Package className="w-8 h-8 mb-2 text-accent" />
              <h3 className="font-semibold">My Items</h3>
              <p className="text-sm text-base-content/60">View borrowing history</p>
            </div>
          </Link>
          
          <Link href="/user/pair-card" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <CreditCard className="w-8 h-8 mb-2 text-accent" />
              <h3 className="font-semibold">Pair NFC Card</h3>
              <p className="text-sm text-base-content/60">Link your NFC card</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
