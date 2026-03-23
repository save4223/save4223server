'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Wrench, Zap, Box, ArrowLeft, Pencil, Settings, Languages, Package, ClipboardList, CheckCircle } from 'lucide-react'

type Language = 'en' | 'zh'

interface ToolType {
  id: number
  name: string
  nameCnSimplified: string | null
  nameCnTraditional: string | null
  category: string | null
  description: string | null
  descriptionCn: string | null
  imageUrl: string | null
  maxBorrowDuration: string | null
  total: number
  available: number
}

// Category icon mapping
function CategoryIcon({ category }: { category: string | null }) {
  const icons: Record<string, React.ReactNode> = {
    TOOL: <Wrench className="w-10 h-10 text-base-content/30" />,
    DEVICE: <Zap className="w-10 h-10 text-base-content/30" />,
    CONSUMABLE: <Box className="w-10 h-10 text-base-content/30" />,
  }
  return icons[category || ''] || <Package className="w-10 h-10 text-base-content/30" />
}

export default function ToolTypesPage() {
  const [types, setTypes] = useState<ToolType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch tool types with stats in a single query
        const typesRes = await fetch('/api/tool-types/stats')
        if (!typesRes.ok) throw new Error('Failed to fetch tool types')
        const typesData = await typesRes.json()
        setTypes(typesData)

        // Fetch user profile to check admin status
        const profileRes = await fetch('/api/user/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          setIsAdmin(profile.role === 'ADMIN')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredTypes = useMemo(() => {
    if (!showOnlyAvailable) return types
    return types.filter(t => t.available > 0)
  }, [types, showOnlyAvailable])

  const stats = useMemo(() => {
    const totalTypes = filteredTypes.length
    const totalItems = filteredTypes.reduce((sum, t) => sum + t.total, 0)
    const totalAvailable = filteredTypes.reduce((sum, t) => sum + t.available, 0)
    return { totalTypes, totalItems, totalAvailable }
  }, [filteredTypes])

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
              <h2 className="card-title text-error">Failed to Load</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-accent btn-sm mt-4">Retry</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/tools" className="btn btn-ghost btn-sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools
              </Link>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-accent" />
                <h1 className="text-xl sm:text-2xl font-bold text-accent">Tool Types</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer btn btn-ghost btn-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-accent checkbox-sm"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                />
                <span className="text-sm">
                  {language === 'zh' ? '仅显示可用' : 'Available only'}
                </span>
              </label>
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="btn btn-ghost btn-sm"
                title={language === 'en' ? '切换中文' : 'Switch to English'}
              >
                <Languages className="w-4 h-4 mr-1" />
                {language === 'en' ? '中文' : 'English'}
              </button>
              {isAdmin && (
                <Link href="/admin/tool-types" className="btn btn-accent btn-sm">
                  <Settings className="w-4 h-4 mr-1" /> Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <ClipboardList className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.totalTypes}</div>
              <div className="mt-2 text-base-content/70">
                {language === 'zh' ? '工具类型总数' : 'Total Tool Types'}
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <CheckCircle className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.totalAvailable}</div>
              <div className="mt-2 text-base-content/70">
                {language === 'zh' ? '可用工具' : 'Available Tools'}
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body items-center text-center">
              <Package className="w-10 h-10 mb-4 text-accent" />
              <div className="text-3xl font-bold text-accent">{stats.totalItems}</div>
              <div className="mt-2 text-base-content/70">
                {language === 'zh' ? '工具项目总数' : 'Total Tool Items'}
              </div>
            </div>
          </div>
        </div>

        {/* Type List */}
        <div className="mt-8 card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <tr>
                  <th className="text-left">{language === 'zh' ? '图片' : 'Image'}</th>
                  <th className="text-left">{language === 'zh' ? '类型名称' : 'Type Name'}</th>
                  <th className="text-left">{language === 'zh' ? '类别' : 'Category'}</th>
                  <th className="text-left">{language === 'zh' ? '最大借用天数' : 'Max Days'}</th>
                  <th className="text-left">{language === 'zh' ? '总数' : 'Total'}</th>
                  <th className="text-left">{language === 'zh' ? '可用' : 'Available'}</th>
                  {isAdmin && <th className="text-left">{language === 'zh' ? '操作' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((type) => {
                  const displayName = language === 'zh' && type.nameCnSimplified ? type.nameCnSimplified : type.name
                  const displayDesc = language === 'zh' && type.descriptionCn ? type.descriptionCn : type.description

                  return (
                    <tr key={type.id} className="hover:bg-base-200/50">
                      <td className="whitespace-nowrap">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-base-200 flex items-center justify-center">
                          {type.imageUrl ? (
                            <img src={`/api/image-proxy?url=${encodeURIComponent(type.imageUrl!)}`} alt={displayName} className="h-full w-full object-cover" />
                          ) : (
                            <CategoryIcon category={type.category} />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{displayName}</span>
                          <span className="text-sm text-base-content/60 line-clamp-1 max-w-xs">
                            {displayDesc || (language === 'zh' ? '无描述' : 'No description')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-ghost">
                          {type.category}
                        </span>
                      </td>
                      <td className="text-base-content/70">
                        {type.maxBorrowDuration || '7 days'}
                      </td>
                      <td>
                        <span className="font-semibold">{type.total}</span>
                      </td>
                      <td>
                        <span className={`badge ${type.available > 0 ? 'badge-success' : 'badge-ghost'}`}>
                          {type.available}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <Link
                            href={`/admin/tool-types/${type.id}/edit`}
                            className="btn btn-warning btn-sm"
                          >
                            <Pencil className="w-4 h-4 mr-1" /> {language === 'zh' ? '编辑' : 'Edit'}
                          </Link>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredTypes.length === 0 && (
          <div className="mt-8 card bg-base-200">
            <div className="card-body items-center text-center py-12">
              <Package className="w-16 h-16 text-base-content/30 mb-4" />
              <h3 className="text-xl font-bold mt-4">
                {showOnlyAvailable
                  ? (language === 'zh' ? '无可用工具' : 'No Available Tools')
                  : (language === 'zh' ? '无工具类型' : 'No Tool Types')}
              </h3>
              <p className="text-base-content/60 mt-2">
                {showOnlyAvailable
                  ? (language === 'zh' ? '当前没有可用的工具，请稍后查看' : 'No tools are currently available. Check back later.')
                  : (language === 'zh' ? '请先创建工具类型' : 'Please create tool types first')}
              </p>
              {showOnlyAvailable && (
                <button
                  onClick={() => setShowOnlyAvailable(false)}
                  className="btn btn-accent btn-sm mt-4"
                >
                  {language === 'zh' ? '显示全部' : 'Show All'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
