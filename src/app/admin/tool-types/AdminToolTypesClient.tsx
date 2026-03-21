'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Pencil, Wrench, Zap, Box, Package, ChevronDown, ChevronRight } from 'lucide-react'

interface ToolType {
  id: number
  name: string
  category: string | null
  maxBorrowDuration: string | null
  imageUrl: string | null
}

interface ToolItem {
  id: string
  rfidTag: string
  status: 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE'
  homeLocation: string
  currentHolder: string | null
}

interface AdminToolTypesClientProps {
  types: ToolType[]
  locations: { id: number; name: string }[]
}

function CategoryIcon({ category }: { category: string | null }) {
  const icons: Record<string, React.ReactNode> = {
    TOOL: <Wrench className="w-5 h-5" />,
    DEVICE: <Zap className="w-5 h-5" />,
    CONSUMABLE: <Box className="w-5 h-5" />,
  }
  return icons[category || ''] || <Package className="w-5 h-5" />
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { class: string; label: string }> = {
    AVAILABLE: { class: 'badge-success', label: 'Available' },
    BORROWED: { class: 'badge-warning', label: 'Borrowed' },
    MISSING: { class: 'badge-error', label: 'Missing' },
    MAINTENANCE: { class: 'badge-info', label: 'Maintenance' },
  }
  const config = configs[status] || configs.AVAILABLE
  return <span className={`badge badge-sm ${config.class}`}>{config.label}</span>
}

function DeleteButton({ id, name, onDelete }: { id: number; name: string; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will also delete all ${name} tools. This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/tool-types/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }

      onDelete()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="btn btn-error btn-sm"
    >
      {deleting ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <>
          <Trash2 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Delete</span>
        </>
      )}
    </button>
  )
}

function ToolItemRow({ item, onDelete }: { item: ToolItem; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete tool "${item.rfidTag}"?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      onDelete()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <tr className="bg-base-200/50">
      <td className="py-2 pl-4">
        <span className="font-mono text-sm">{item.rfidTag}</span>
      </td>
      <td className="py-2">
        <StatusBadge status={item.status} />
      </td>
      <td className="py-2 text-sm text-base-content/70">{item.homeLocation}</td>
      <td className="py-2 text-sm">{item.currentHolder || '-'}</td>
      <td className="py-2 text-right pr-4">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-ghost btn-xs text-error"
        >
          {deleting ? <span className="loading loading-spinner loading-xs"></span> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  )
}

function AddInstanceForm({
  typeId,
  locations,
  onSuccess
}: {
  typeId: number;
  locations: { id: number; name: string }[];
  onSuccess: (item: ToolItem) => void
}) {
  const [rfidTag, setRfidTag] = useState('')
  const [status, setStatus] = useState('AVAILABLE')
  const [locationId, setLocationId] = useState(locations[0]?.id?.toString() || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rfidTag.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfidTag: rfidTag.trim(),
          itemTypeId: typeId,
          homeLocationId: locationId ? parseInt(locationId) : null,
          status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }

      const newItem = await res.json()
      onSuccess({
        id: newItem.id,
        rfidTag: newItem.rfidTag,
        status: newItem.status,
        homeLocation: locations.find(l => l.id === parseInt(locationId))?.name || 'Unknown',
        currentHolder: null,
      })
      setRfidTag('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end p-3 bg-base-200/50 rounded-lg mb-2">
      <div className="form-control">
        <label className="label py-0">
          <span className="label-text text-xs">RFID Tag</span>
        </label>
        <input
          type="text"
          value={rfidTag}
          onChange={(e) => setRfidTag(e.target.value)}
          placeholder="e.g., RFID-001"
          className="input input-bordered input-sm w-40"
          required
        />
      </div>
      <div className="form-control">
        <label className="label py-0">
          <span className="label-text text-xs">Status</span>
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="AVAILABLE">Available</option>
          <option value="BORROWED">Borrowed</option>
          <option value="MISSING">Missing</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label py-0">
          <span className="label-text text-xs">Location</span>
        </label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="select select-bordered select-sm"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={saving || !rfidTag.trim()}
        className="btn btn-accent btn-sm"
      >
        {saving ? <span className="loading loading-spinner loading-xs"></span> : <Plus className="w-4 h-4" />}
        Add
      </button>
    </form>
  )
}

function ToolTypeRow({
  type,
  locations,
  onDelete
}: {
  type: ToolType;
  locations: { id: number; name: string }[];
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<ToolItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expanded && items.length === 0) {
      setLoading(true)
      fetch(`/api/items?typeId=${type.id}`)
        .then(res => res.json())
        .then(data => {
          setItems(data.map((item: ToolItem & { location?: { name: string } }) => ({
            ...item,
            homeLocation: item.homeLocation || 'Unknown',
          })))
        })
        .finally(() => setLoading(false))
    }
  }, [expanded, type.id])

  function handleNewItem(item: ToolItem) {
    setItems([...items, item])
  }

  function handleDeleteItem(id: string) {
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <>
      <tr className="hover:bg-base-200/50">
        <td>{type.id}</td>
        <td>
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
            {type.imageUrl ? (
              <img src={`/api/image-proxy?url=${encodeURIComponent(type.imageUrl!)}`} alt={type.name} className="h-full w-full object-cover" />
            ) : (
              <CategoryIcon category={type.category} />
            )}
          </div>
        </td>
        <td className="font-semibold">{type.name}</td>
        <td><span className="badge badge-ghost">{type.category}</span></td>
        <td>{type.maxBorrowDuration ? type.maxBorrowDuration.replace('days', 'days').replace('day', 'day') : '7 days'}</td>
        <td>
          <div className="flex gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn btn-ghost btn-sm"
              title="View instances"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Instances
            </button>
            <Link
              href={`/admin/tool-types/${type.id}/edit`}
              className="btn btn-warning btn-sm"
            >
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Link>
            <DeleteButton
              id={type.id}
              name={type.name}
              onDelete={onDelete}
            />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="p-4 bg-base-100">
              <AddInstanceForm
                typeId={type.id}
                locations={locations}
                onSuccess={handleNewItem}
              />
              {loading ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-sm text-accent"></span>
                </div>
              ) : items.length > 0 ? (
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/60">
                      <th className="py-1 pl-4">RFID Tag</th>
                      <th className="py-1">Status</th>
                      <th className="py-1">Location</th>
                      <th className="py-1">Holder</th>
                      <th className="py-1 text-right pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <ToolItemRow
                        key={item.id}
                        item={item}
                        onDelete={() => handleDeleteItem(item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-sm text-base-content/50 py-4">
                  No instances yet. Add one above.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminToolTypesClient({ types: initialTypes, locations }: AdminToolTypesClientProps) {
  const router = useRouter()
  const [types, setTypes] = useState(initialTypes)

  function handleDelete(id: number) {
    setTypes(types.filter(t => t.id !== id))
    router.refresh()
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Link href="/admin/tool-types" className="btn btn-ghost btn-sm w-fit">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">Manage Tool Types</h2>
          <Link href="/admin/tool-types/new" className="btn btn-accent">
            <Plus className="w-4 h-4 mr-1" /> Create New Type
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Max Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <ToolTypeRow
                  key={type.id}
                  type={type}
                  locations={locations}
                  onDelete={() => handleDelete(type.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {types.length === 0 && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body items-center text-center py-12">
            <Package className="w-16 h-16 text-base-content/30 mb-4" />
            <h3 className="text-xl font-bold mt-4">No Tool Types</h3>
            <p className="text-base-content/60 mt-2">Create your first tool type to get started</p>
            <Link href="/admin/tool-types/new" className="btn btn-accent mt-4">
              <Plus className="w-4 h-4 mr-1" /> Create New Type
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
