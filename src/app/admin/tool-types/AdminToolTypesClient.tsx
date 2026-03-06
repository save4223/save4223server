'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Pencil, Wrench, Zap, Box, Package } from 'lucide-react'

interface ToolType {
  id: number
  name: string
  category: string | null
  maxBorrowDuration: string | null
  imageUrl: string | null
}

interface AdminToolTypesClientProps {
  types: ToolType[]
}

function CategoryIcon({ category }: { category: string | null }) {
  const icons: Record<string, React.ReactNode> = {
    TOOL: <Wrench className="w-5 h-5" />,
    DEVICE: <Zap className="w-5 h-5" />,
    CONSUMABLE: <Box className="w-5 h-5" />,
  }
  return icons[category || ''] || <Package className="w-5 h-5" />
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

export default function AdminToolTypesClient({ types: initialTypes }: AdminToolTypesClientProps) {
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
        <Link href="/admin" className="btn btn-ghost btn-sm w-fit">
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
                <tr key={type.id}>
                  <td>{type.id}</td>
                  <td>
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
                      {type.imageUrl ? (
                        <img src={type.imageUrl} alt={type.name} className="h-full w-full object-cover" />
                      ) : (
                        <CategoryIcon category={type.category} />
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{type.name}</td>
                  <td><span className="badge badge-ghost">{type.category}</span></td>
                  <td>{type.maxBorrowDuration || '7 days'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/tool-types/${type.id}/edit`}
                        className="btn btn-warning btn-sm"
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Link>
                      <DeleteButton 
                        id={type.id} 
                        name={type.name}
                        onDelete={() => handleDelete(type.id)}
                      />
                    </div>
                  </td>
                </tr>
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
