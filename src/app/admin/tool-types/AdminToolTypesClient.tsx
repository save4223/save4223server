'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ToolType {
  id: number
  name: string
  category: string
  maxBorrowDuration: string | null
  imageUrl: string | null
}

interface AdminToolTypesClientProps {
  types: ToolType[]
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
        '🗑️ Delete'
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
      {/* Mobile-friendly header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Link href="/admin" className="btn btn-ghost btn-sm w-fit">
          ← Back to Admin
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">Manage Tool Types</h2>
          <Link href="/admin/tool-types/new" className="btn btn-accent btn-sm sm:btn-md">
            <span className="hidden sm:inline">+ Create New Type</span>
            <span className="sm:hidden">+ New</span>
          </Link>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th className="hidden sm:table-cell">ID</th>
                <th>Image</th>
                <th>Name</th>
                <th className="hidden md:table-cell">Category</th>
                <th className="hidden lg:table-cell">Max Duration</th>
                <th className="w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id}>
                  <td className="hidden sm:table-cell">{type.id}</td>
                  <td>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
                      {type.imageUrl ? (
                        <img src={type.imageUrl} alt={type.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg sm:text-xl">
                          {type.category === 'TOOL' && '🔧'}
                          {type.category === 'DEVICE' && '🔌'}
                          {type.category === 'CONSUMABLE' && '📦'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold">{type.name}</td>
                  <td className="hidden md:table-cell"><span className="badge badge-ghost">{type.category}</span></td>
                  <td className="hidden lg:table-cell">{type.maxBorrowDuration || '7 days'}</td>
                  <td>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link 
                        href={`/admin/tool-types/${type.id}/edit`}
                        className="btn btn-warning btn-xs sm:btn-sm"
                      >
                        ✏️ <span className="hidden sm:inline">Edit</span>
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
            <div className="text-6xl">📦</div>
            <h3 className="text-xl font-bold mt-4">No Tool Types</h3>
            <p className="text-base-content/60 mt-2">Create your first tool type to get started</p>
            <Link href="/admin/tool-types/new" className="btn btn-accent mt-4">
              + Create New Type
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
