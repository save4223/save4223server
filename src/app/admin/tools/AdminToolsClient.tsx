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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Tools</h2>
        <Link href="/admin/tools/new" className="btn btn-accent">
          + Add New Tool
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by RFID, type, or location..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input input-bordered w-full max-w-md"
        />
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>ID</th>
                <th>RFID Tag</th>
                <th>Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Current Holder</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool) => (
                <tr key={tool.id}>
                  <td className="font-mono text-xs">{tool.id.slice(-8)}...</td>
                  <td className="font-mono">{tool.rfidTag}</td>
                  <td>{tool.itemTypeName}</td>
                  <td>
                    <span className={`badge badge-sm ${
                      tool.status === 'AVAILABLE' ? 'badge-success' :
                      tool.status === 'BORROWED' ? 'badge-warning' :
                      tool.status === 'MISSING' ? 'badge-error' :
                      'badge-ghost'
                    }`}>
                      {tool.status}
                    </span>
                  </td>
                  <td>{tool.homeLocation}</td>
                  <td>{tool.holderName || '-'}</td>
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
