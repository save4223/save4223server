'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  fullName: string | null
  role: 'ADMIN' | 'MANAGER' | 'USER'
  createdAt: string
}

interface BorrowedItem {
  id: string
  rfidTag: string
}

function RoleBadge({ role }: { role: string }) {
  const configs = {
    ADMIN: { class: 'badge-error', icon: '👑' },
    MANAGER: { class: 'badge-warning', icon: '⭐' },
    USER: { class: 'badge-ghost', icon: '👤' },
  }
  const config = configs[role as keyof typeof configs] || configs.USER
  
  return (
    <span className={`badge ${config.class} badge-sm`}>
      {config.icon} {role}
    </span>
  )
}

function RoleSelect({ userId, currentRole, onChange }: { userId: string; currentRole: string; onChange: () => void }) {
  const [updating, setUpdating] = useState(false)

  async function handleRoleChange(newRole: string) {
    if (newRole === currentRole) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }

      onChange()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={updating}
      className="select select-bordered select-sm w-full max-w-[120px]"
    >
      <option value="USER">USER</option>
      <option value="MANAGER">MANAGER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('USER')
  const [inviting, setInviting] = useState(false)
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([])
  const [checkingItems, setCheckingItems] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch users')
      }
      
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function initiateDelete(user: User) {
    setDeletingUser(user)
    setCheckingItems(true)
    setShowDeleteModal(true)
    
    try {
      // Check for borrowed items
      const res = await fetch(`/api/admin/users/${user.id}`)
      const data = await res.json()
      setBorrowedItems(data.items || [])
    } catch (err) {
      console.error('Failed to check borrowed items:', err)
      setBorrowedItems([])
    } finally {
      setCheckingItems(false)
    }
  }

  async function handleDelete(force = false) {
    if (!deletingUser) return
    
    setDeleting(true)
    try {
      const url = `/api/admin/users/${deletingUser.id}${force ? '?force=true' : ''}`
      const res = await fetch(url, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }

      const data = await res.json()
      setUsers(users.filter(u => u.id !== deletingUser.id))
      setShowDeleteModal(false)
      setDeletingUser(null)
      setBorrowedItems([])
      
      // Show success message
      alert(data.message)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to invite')
      }

      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('USER')
      fetchUsers() // Refresh list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-accent"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-base-200">
        <div className="card-body items-center text-center py-12">
          <div className="text-4xl">⚠️</div>
          <h2 className="card-title text-error">{error}</h2>
          <button onClick={fetchUsers} className="btn btn-accent btn-sm mt-4">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Link href="/admin" className="btn btn-ghost btn-sm w-fit">
          ← Back to Admin
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">👥 User Management</h2>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn btn-accent btn-sm sm:btn-md"
          >
            <span className="hidden sm:inline">+ Invite User</span>
            <span className="sm:hidden">+ Invite</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>User</th>
                <th className="hidden md:table-cell">Email</th>
                <th>Role</th>
                <th className="hidden sm:table-cell">Joined</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-accent text-accent-content rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {(user.fullName || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">{user.fullName || 'No name'}</p>
                        <p className="text-xs text-base-content/60 md:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">{user.email}</td>
                  <td>
                    <RoleSelect 
                      userId={user.id} 
                      currentRole={user.role}
                      onChange={fetchUsers}
                    />
                  </td>
                  <td className="hidden sm:table-cell text-sm text-base-content/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => initiateDelete(user)}
                      className="btn btn-error btn-xs"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="card bg-base-200 mt-8">
          <div className="card-body items-center text-center py-12">
            <div className="text-6xl">👥</div>
            <h3 className="text-xl font-bold mt-4">No Users</h3>
            <p className="text-base-content/60 mt-2">Invite your first user to get started</p>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn btn-accent mt-4"
            >
              + Invite User
            </button>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card bg-base-100 w-full max-w-md">
            <form onSubmit={handleInvite} className="card-body">
              <h3 className="card-title mb-4">📧 Invite New User</h3>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email Address *</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="USER">👤 User</option>
                  <option value="MANAGER">⭐ Manager</option>
                  <option value="ADMIN">👑 Admin</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn btn-accent flex-1"
                >
                  {inviting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Inviting...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card bg-base-100 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="card-body">
              <h3 className="card-title text-error mb-4">🗑️ Delete User</h3>
              
              <p className="mb-4">
                Are you sure you want to delete <strong>{deletingUser.fullName || deletingUser.email}</strong>?
              </p>

              {checkingItems ? (
                <div className="flex items-center gap-2 py-4">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Checking borrowed items...</span>
                </div>
              ) : borrowedItems.length > 0 ? (
                <div className="alert alert-warning mb-4">
                  <div>
                    <p className="font-semibold">⚠️ This user has {borrowedItems.length} borrowed item(s):</p>
                    <ul className="mt-2 text-sm space-y-1">
                      {borrowedItems.map(item => (
                        <li key={item.id} className="font-mono">{item.rfidTag}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm">
                      They must return all items before deletion, or use Force Delete to mark items as maintenance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="alert alert-success mb-4">
                  <span>✅ This user has no borrowed items.</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {borrowedItems.length > 0 ? (
                  <>
                    <button
                      onClick={() => handleDelete(true)}
                      disabled={deleting || checkingItems}
                      className="btn btn-error flex-1"
                    >
                      {deleting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Deleting...
                        </>
                      ) : (
                        '⚠️ Force Delete'
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(false)}
                      disabled={deleting || checkingItems}
                      className="btn btn-outline flex-1"
                    >
                      Delete Anyway
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(false)}
                    disabled={deleting || checkingItems}
                    className="btn btn-error flex-1"
                  >
                    {deleting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Deleting...
                      </>
                    ) : (
                      'Delete User'
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingUser(null)
                    setBorrowedItems([])
                  }}
                  disabled={deleting}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
