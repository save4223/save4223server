'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ToolType {
  id: number
  name: string
  category: 'TOOL' | 'DEVICE' | 'CONSUMABLE' | null
  description: string | null
  imageUrl: string | null
  maxBorrowDuration: string | null
  totalQuantity: number
  createdAt: string
}

const CATEGORIES = [
  { value: 'TOOL', label: '工具', icon: '🔧' },
  { value: 'DEVICE', label: '设备', icon: '🔌' },
  { value: 'CONSUMABLE', label: '耗材', icon: '📦' },
]

const MAX_BORROW_OPTIONS = [
  { value: '1 day', label: '1 天' },
  { value: '3 days', label: '3 天' },
  { value: '7 days', label: '7 天' },
  { value: '14 days', label: '14 天' },
  { value: '30 days', label: '30 天' },
]

export default function AdminToolTypesPage() {
  const router = useRouter()
  const [toolTypes, setToolTypes] = useState<ToolType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ToolType | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'TOOL' as string,
    description: '',
    imageUrl: '',
    maxBorrowDuration: '7 days',
    totalQuantity: 0,
  })

  useEffect(() => {
    async function checkAdminAndFetch() {
      try {
        // Check user role
        const profileRes = await fetch('/api/user/profile')
        if (!profileRes.ok) {
          router.push('/login')
          return
        }
        const profile = await profileRes.json()
        if (profile.role !== 'ADMIN') {
          setIsAdmin(false)
          return
        }
        setIsAdmin(true)

        // Fetch tool types
        const res = await fetch('/api/tool-types')
        if (!res.ok) throw new Error('Failed to fetch tool types')
        const data = await res.json()
        setToolTypes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    checkAdminAndFetch()
  }, [router])

  function openCreateModal() {
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'TOOL',
      description: '',
      imageUrl: '',
      maxBorrowDuration: '7 days',
      totalQuantity: 0,
    })
    setShowModal(true)
  }

  function openEditModal(item: ToolType) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category || 'TOOL',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      maxBorrowDuration: item.maxBorrowDuration || '7 days',
      totalQuantity: item.totalQuantity || 0,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingItem
        ? `/api/tool-types/${editingItem.id}`
        : '/api/tool-types'
      const method = editingItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      // Refresh list
      const listRes = await fetch('/api/tool-types')
      const listData = await listRes.json()
      setToolTypes(listData)
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/tool-types/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')

      setToolTypes(toolTypes.filter((t) => t.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSavingImage(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)

      const res = await fetch('/api/tool-types/upload', {
        method: 'POST',
        body: uploadData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setFormData({ ...formData, imageUrl: data.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片上传失败')
    } finally {
      setSavingImage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-accent"></span>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-4xl">🚫</div>
          <h2 className="card-title text-error">权限不足</h2>
          <p className="text-base-content/60">只有管理员可以访问此页面</p>
          <Link href="/" className="btn btn-accent mt-4">返回首页</Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="card-title text-error">{error}</h2>
          <button onClick={() => window.location.reload()} className="btn btn-accent mt-4">重试</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">工具类型管理</h1>
          <p className="text-base-content/60">创建、编辑和删除工具类型</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-accent">
          + 新建类型
        </button>
      </div>

      {/* Tool Types Table */}
      <div className="card bg-base-100 shadow border border-base-300">
        {toolTypes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold">暂无工具类型</h3>
            <p className="text-base-content/60 mb-4">点击上方按钮创建第一个工具类型</p>
            <button onClick={openCreateModal} className="btn btn-accent">
              + 新建类型
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>图片</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>最大借用时长</th>
                  <th>数量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {toolTypes.map((item) => (
                  <tr key={item.id} className="hover">
                    <td>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">
                            {item.category === 'TOOL' && '🔧'}
                            {item.category === 'DEVICE' && '🔌'}
                            {item.category === 'CONSUMABLE' && '📦'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td>
                      <span className="badge badge-ghost">
                        {CATEGORIES.find((c) => c.value === item.category)?.icon}
                        {CATEGORIES.find((c) => c.value === item.category)?.label}
                      </span>
                    </td>
                    <td>{item.maxBorrowDuration || '7 天'}</td>
                    <td>{item.totalQuantity}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn btn-ghost btn-sm"
                        >
                          编辑
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-error btn-sm"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn btn-ghost btn-sm"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="btn btn-ghost btn-sm text-error"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingItem ? '编辑工具类型' : '新建工具类型'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">图片</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-base-200 flex items-center justify-center border border-base-300">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-base-content/30">+</span>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                          disabled={savingImage}
                        />
                        {savingImage && (
                          <span className="loading loading-spinner loading-xs mt-2 block"></span>
                        )}
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="btn btn-ghost btn-xs mt-2"
                          >
                            移除图片
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">名称 *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="输入工具类型名称"
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                {/* Category */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">分类</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Borrow Duration */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">最大借用时长</span>
                  </label>
                  <select
                    value={formData.maxBorrowDuration}
                    onChange={(e) => setFormData({ ...formData, maxBorrowDuration: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    {MAX_BORROW_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Total Quantity */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">初始数量</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Description */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">描述</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入工具类型描述（可选）"
                    className="textarea textarea-bordered w-full"
                    rows={3}
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error mt-4">
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={saving || !formData.name}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  )
}
