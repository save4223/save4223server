'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Tool {
  id: string
  rfidTag: string
  status: string
  itemTypeId: number
  itemTypeName: string
  homeLocation: string
  holderName: string | null
}

interface AdminToolsClientProps {
  tools: Tool[]
  toolTypes: { id: number; name: string }[]
}

function DeleteButton({ id, name, onDelete }: { id: string; name: string; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete tool "${name}" (${id})?\n\nThis action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${id}`, {
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
      className="btn btn-error btn-xs"
    >
      {deleting ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        '🗑️'
      )}
    </button>
  )
}

export default function AdminToolsClient({ tools: initialTools, toolTypes }: AdminToolsClientProps) {
  const router = useRouter()
  const [tools, setTools] = useState(initialTools)
  const [filter, setFilter] = useState('')

  const filteredTools = tools.filter(t => 
    t.rfidTag.toLowerCase().includes(filter.toLowerCase()) ||
    t.itemTypeName.toLowerCase().includes(filter.toLowerCase()) ||
    t.homeLocation.toLowerCase().includes(filter.toLowerCase())
  )

  function handleDelete(id: string) {
    setTools(tools.filter(t => t.id !== id))
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
          <h2 className="text-xl sm:text-2xl font-bold">Manage Tools</h2>
          <Link href="/admin/tools/new" className="btn btn-accent btn-sm sm:btn-md">
            <span className="hidden sm:inline">+ Add New Tool</span>
            <span className="sm:hidden">+ New</span>
          </Link>
        </div>
      </div>

      {/* Filter - full width on mobile */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by RFID, type, or location..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th className="hidden sm:table-cell">ID</th>
                <th>RFID Tag</th>
                <th className="hidden md:table-cell">Type</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Location</th>
                <th className="hidden xl:table-cell">Holder</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.id}>
                  <td className="hidden sm:table-cell font-mono text-xs">{tool.id.slice(-8)}...</td>
                  <td className="font-mono text-sm">{tool.rfidTag}</td>
                  <td className="hidden md:table-cell">{tool.itemTypeName}</td>
                  <td>
                    <span className={`badge badge-sm ${
                      tool.status === 'AVAILABLE' ? 'badge-success' :
                      tool.status === 'BORROWED' ? 'badge-warning' :
                      tool.status === 'MISSING' ? 'badge-error' :
                      'badge-ghost'
                    }`}>
                      {tool.status.slice(0, 4)}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">{tool.homeLocation}</td>
                  <td className="hidden xl:table-cell">{tool.holderName || '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link 
                        href={`/admin/tools/${tool.id}/edit`}
                        className="btn btn-warning btn-xs"
                      >
                        ✏️
                      </Link>
                      <DeleteButton 
                        id={tool.id} 
                        name={tool.rfidTag}
                        onDelete={() => handleDelete(tool.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body items-center text-center py-12">
            <div className="text-6xl">🔧</div>
            <h3 className="text-xl font-bold mt-4">{tools.length === 0 ? 'No Tools' : 'No Matching Tools'}</h3>
            <p className="text-base-content/60 mt-2">
              {tools.length === 0 ? 'Add your first tool to get started' : 'Try adjusting your search'}
            </p>
            {tools.length === 0 && (
              <Link href="/admin/tools/new" className="btn btn-accent mt-4">
                + Add New Tool
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
