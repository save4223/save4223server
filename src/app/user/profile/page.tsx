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
          throw new Error('获取资料失败')
        }
        const data = await res.json()
        setProfile(data)
        setFullName(data.fullName || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
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
      
      if (!res.ok) throw new Error('保存失败')
      
      const updated = await res.json()
      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
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
              <Link href="/" className="btn btn-accent btn-sm mt-4">返回首页</Link>
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
              <h1 className="text-2xl font-bold text-accent">👤 个人资料</h1>
              <p className="text-accent/70 text-sm mt-1">管理你的个人信息</p>
            </div>
            <Link href="/user/items" className="btn btn-accent btn-sm">
              我的物品
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
                  注册于 {new Date(profile?.createdAt || '').toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">显示名称</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="输入你的名字"
                  className="input input-bordered w-full"
                  maxLength={50}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    其他用户将看到这个名称
                  </span>
                </label>
              </div>

              {/* Email (readonly) */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-semibold">邮箱</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input input-bordered w-full bg-base-200"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    邮箱不可修改
                  </span>
                </label>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="alert alert-success mb-4">
                  <span>✅ 资料已更新！</span>
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
                      保存中...
                    </>
                  ) : (
                    '保存修改'
                  )}
                </button>
                <Link href="/" className="btn btn-ghost">
                  取消
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
              <h3 className="font-semibold">我的物品</h3>
              <p className="text-sm text-base-content/60">查看借用记录</p>
            </div>
          </Link>
          <Link href="/tools" className="card bg-base-100 shadow hover:shadow-lg transition-all border border-base-300">
            <div className="card-body items-center text-center py-6">
              <div className="text-3xl mb-2">🔧</div>
              <h3 className="font-semibold">工具库</h3>
              <p className="text-sm text-base-content/60">浏览可用工具</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
