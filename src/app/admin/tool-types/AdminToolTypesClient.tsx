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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Tool Types</h2>
        <Link href="/admin/tool-types/new" className="btn btn-accent">
          + Create New Type
        </Link>
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
                <th className="w-48">Actions</th>
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
                        <span className="text-xl">
                          {type.category === 'TOOL' && '🔧'}
                          {type.category === 'DEVICE' && '🔌'}
                          {type.category === 'CONSUMABLE' && '📦'}
                        </span>
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
                        ✏️ Edit
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
