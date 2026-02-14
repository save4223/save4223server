'use client'

import Link from 'next/link'
import { useState } from 'react'

type ItemStatus = 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE'

interface ToolItem {
  id: string
  rfidTag: string
  status: ItemStatus
  holderName: string | null
  dueAt: string | null
  homeLocation: string
}

interface ToolType {
  id: number
  name: string
  category: string
  description: string | null
  imageUrl: string | null
  maxBorrowDuration: string
  items: ToolItem[]
}

const mockTools: ToolType[] = [
  {
    id: 1,
    name: 'Oscilloscope',
    category: 'DEVICE',
    description: 'Digital oscilloscope',
    imageUrl: null,
    maxBorrowDuration: '14 days',
    items: [
      { id: '1', rfidTag: 'RFID-OSC-001', status: 'BORROWED', holderName: 'Test User', dueAt: '2026-02-28T07:42:21Z', homeLocation: 'Cabinet A' },
      { id: '2', rfidTag: 'RFID-OSC-002', status: 'AVAILABLE', holderName: null, dueAt: null, homeLocation: 'Cabinet A' },
    ],
  },
  {
    id: 2,
    name: 'Screwdriver Set',
    category: 'TOOL',
    description: 'Precision tools',
    imageUrl: null,
    maxBorrowDuration: '7 days',
    items: [
      { id: '3', rfidTag: 'RFID-TOOL-001', status: 'AVAILABLE', holderName: null, dueAt: null, homeLocation: 'Cabinet A' },
    ],
  },
]

function getCategoryIcon(cat: string) {
  if (cat === 'TOOL') return '🔧'
  if (cat === 'DEVICE') return '🔌'
  return '📦'
}

function StatusBadge({ status, dueAt }: { status: ItemStatus; dueAt: string | null }) {
  const isOverdue = dueAt && new Date(dueAt) < new Date()
  
  if (status === 'AVAILABLE') {
    return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">可借</span>
  }
  if (status === 'BORROWED') {
    return <span className={`rounded-full px-2 py-1 text-xs ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{isOverdue ? '已逾期' : '已借出'}</span>
  }
  return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">{status}</span>
}

export default function ToolsPage() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]))
  const [category, setCategory] = useState('ALL')
  
  const filtered = category === 'ALL' ? mockTools : mockTools.filter(t => t.category === category)
  
  const toggle = (id: number) => {
    const n = new Set(expanded)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setExpanded(n)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">工具库</h1>
              <p className="mt-1 text-sm text-gray-600">查看所有工具及其借用状态</p>
            </div>
            <Link href="/tool-types" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">管理工具类型</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 分类筛选 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {['ALL', 'TOOL', 'DEVICE', 'CONSUMABLE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${category === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {cat === 'ALL' ? '全部' : cat === 'TOOL' ? '🔧 工具' : cat === 'DEVICE' ? '🔌 设备' : '📦 耗材'}
            </button>
          ))}
        </div>

        {/* 工具列表 */}
        <div className="space-y-6">
          {filtered.map((tool) => {
            const available = tool.items.filter(i => i.status === 'AVAILABLE').length
            const borrowed = tool.items.filter(i => i.status === 'BORROWED').length
            const isOpen = expanded.has(tool.id)
            
            return (
              <div key={tool.id} className="overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* 头部 - 可点击展开 */}
                <div className="flex cursor-pointer items-center gap-6 p-6 hover:bg-gray-50" onClick={() => toggle(tool.id)}>
                  {/* 图片占位区 */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
                    {tool.imageUrl ? (
                      <img src={tool.imageUrl} alt={tool.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">{getCategoryIcon(tool.category)}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center text-xs text-white">图片占位</div>
                  </div>
                  
                  {/* 工具信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{tool.category}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{tool.description || '暂无描述'}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-600">最大借用: <span className="font-medium">{tool.maxBorrowDuration}</span></span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">总数: <span className="font-medium">{tool.items.length}</span></span>
                    </div>
                  </div>
                  
                  {/* 统计 */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">{available} 可借</span>
                      {borrowed > 0 && <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">{borrowed} 借出</span>}
                    </div>
                    <span className="text-sm text-gray-500">{isOpen ? '点击收起 ▲' : '点击展开 ▼'}</span>
                  </div>
                </div>
                
                {/* 展开的个体列表 */}
                {isOpen && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">个体借用状态</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {tool.items.map((item) => (
                        <div key={item.id} className={`rounded-xl border p-4 ${item.status === 'AVAILABLE' ? 'border-green-200 bg-white' : 'border-yellow-200 bg-yellow-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-gray-600">{item.rfidTag}</span>
                            <StatusBadge status={item.status} dueAt={item.dueAt} />
                          </div>
                          
                          {item.status === 'BORROWED' && (
                            <div className="mt-3 space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">借用人:</span><span className="font-medium text-gray-900">{item.holderName}</span></div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">应还日期:</span>
                                <span className={`font-medium ${item.dueAt && new Date(item.dueAt) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                                  {item.dueAt ? new Date(item.dueAt).toLocaleDateString('zh-CN') : '-'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {item.status === 'AVAILABLE' && (
                            <div className="mt-3 flex items-center justify-between text-sm">
                              <span className="text-gray-500">位置:</span><span className="text-gray-900">{item.homeLocation}</span>
                            </div>
                          )}
                          
                          {item.status === 'AVAILABLE' && (
                            <button className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">借用</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
