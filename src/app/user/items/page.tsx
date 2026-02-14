'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type ItemStatus = 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE'
type TransactionAction = 'BORROW' | 'RETURN' | 'MISSING_UNEXPECTED'

interface ItemType {
  id: number
  name: string
  category: string
  description: string | null
  imageUrl: string | null
}

interface HeldItem {
  id: string
  rfidTag: string
  status: ItemStatus
  dueAt: string | null
  itemType: ItemType
  homeLocation: string
}

interface Transaction {
  id: number
  actionType: TransactionAction
  timestamp: string
  item: {
    id: string
    rfidTag: string
    itemType: {
      name: string
      category: string
    }
  }
  session: {
    id: string
    cabinetId: number
    startTime: string
  } | null
}

interface UserItemsData {
  heldItems: HeldItem[]
  recentTransactions: Transaction[]
}

function StatusBadge({ status, dueAt }: { status: ItemStatus; dueAt: string | null }) {
  const isOverdue = dueAt && new Date(dueAt) < new Date()
  
  if (status === 'BORROWED' && isOverdue) {
    return <span className="badge badge-error">已逾期</span>
  }
  if (status === 'BORROWED') {
    return <span className="badge badge-warning">借用中</span>
  }
  return <span className="badge badge-neutral">{status}</span>
}

function ActionBadge({ action }: { action: TransactionAction }) {
  const configs = {
    BORROW: { class: 'badge-accent', label: '借用' },
    RETURN: { class: 'badge-success', label: '归还' },
    MISSING_UNEXPECTED: { class: 'badge-error', label: '异常丢失' },
  }
  const config = configs[action]
  return <span className={`badge ${config.class}`}>{config.label}</span>
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    TOOL: '🔧',
    DEVICE: '🔌',
    CONSUMABLE: '📦',
  }
  return <span>{icons[category] || '📎'}</span>
}

export default function UserItemsPage() {
  const [data, setData] = useState<UserItemsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserItems() {
      try {
        setLoading(true)
        const res = await fetch('/api/user/items')
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('请先登录')
          }
          throw new Error('获取数据失败')
        }
        const result = await res.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
      }
    }
    fetchUserItems()
  }, [])

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
              <Link href="/login" className="btn btn-accent btn-sm mt-4">去登录</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const heldItems = data?.heldItems || []
  const transactions = data?.recentTransactions || []

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-accent">📋 我的物品</h1>
              <p className="text-accent/70 text-sm mt-1">查看借用物品和交易记录</p>
            </div>
            <Link href="/tools" className="btn btn-accent btn-sm">
              去工具库
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 当前持有物品 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-base-content">📦 当前借用物品</h2>
            <span className="badge badge-accent">{heldItems.length}</span>
          </div>

          {heldItems.length === 0 ? (
            <div className="card bg-base-200">
              <div className="card-body items-center text-center py-12">
                <div className="text-5xl">📭</div>
                <p className="text-base-content/60 mt-4">暂无借用物品</p>
                <Link href="/tools" className="btn btn-accent btn-sm mt-4">去借用工具</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {heldItems.map((item) => {
                const isOverdue = item.dueAt && new Date(item.dueAt) < new Date()
                
                return (
                  <div key={item.id} className={`card bg-base-100 shadow-md border ${isOverdue ? 'border-error' : 'border-base-300'}`}>
                    <div className="card-body">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={item.itemType.category} />
                          <h3 className="card-title text-base">{item.itemType.name}</h3>
                        </div>
                        <StatusBadge status={item.status} dueAt={item.dueAt} />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/60">RFID:</span>
                          <span className="font-mono">{item.rfidTag}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/60">存放位置:</span>
                          <span>{item.homeLocation}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-base-content/60">应还日期:</span>
                          <span className={isOverdue ? 'text-error font-semibold' : ''}>
                            {item.dueAt ? new Date(item.dueAt).toLocaleDateString('zh-CN') : '未设置'}
                          </span>
                        </div>
                      </div>

                      {isOverdue && (
                        <div className="alert alert-error alert-sm mt-4">
                          <span>⚠️ 已逾期，请尽快归还！</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 最近交易记录 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-base-content">📜 最近交易记录</h2>
            <span className="badge badge-neutral">最近5次</span>
          </div>

          {transactions.length === 0 ? (
            <div className="card bg-base-200">
              <div className="card-body items-center text-center py-12">
                <div className="text-5xl">📭</div>
                <p className="text-base-content/60 mt-4">暂无交易记录</p>
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-md">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr className="bg-base-200">
                      <th>操作</th>
                      <th>物品</th>
                      <th>RFID</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td><ActionBadge action={tx.actionType} /></td>
                        <td className="flex items-center gap-2">
                          <CategoryIcon category={tx.item.itemType.category} />
                          {tx.item.itemType.name}
                        </td>
                        <td className="font-mono text-sm">{tx.item.rfidTag}</td>
                        <td className="text-sm text-base-content/70">
                          {new Date(tx.timestamp).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
