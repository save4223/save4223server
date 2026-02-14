'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

type ItemStatus = 'AVAILABLE' | 'BORROWED' | 'MISSING' | 'MAINTENANCE'
type Category = 'ALL' | 'TOOL' | 'DEVICE' | 'CONSUMABLE'

interface ToolItem {
  id: string
  rfidTag: string
  status: ItemStatus
  holderName: string | null
  holderEmail: string | null
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

// 模拟数据 - 替换为 API 调用
const mockTools: ToolType[] = [
  {
    id: 1,
    name: 'Digital Oscilloscope',
    category: 'DEVICE',
    description: '100MHz digital oscilloscope for signal analysis and debugging',
    imageUrl: null,
    maxBorrowDuration: '14 days',
    items: [
      { id: '1', rfidTag: 'RFID-OSC-001', status: 'BORROWED', holderName: 'Vicky', holderEmail: 'vicky@example.com', dueAt: '2026-02-28T07:42:21Z', homeLocation: 'Cabinet A' },
      { id: '2', rfidTag: 'RFID-OSC-002', status: 'AVAILABLE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Cabinet A' },
      { id: '3', rfidTag: 'RFID-OSC-003', status: 'AVAILABLE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Cabinet A' },
    ],
  },
  {
    id: 2,
    name: 'Precision Screwdriver Set',
    category: 'TOOL',
    description: 'Professional precision screwdrivers for electronics repair',
    imageUrl: null,
    maxBorrowDuration: '7 days',
    items: [
      { id: '4', rfidTag: 'RFID-TOOL-001', status: 'AVAILABLE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Drawer 1' },
    ],
  },
  {
    id: 3,
    name: 'Multimeter',
    category: 'DEVICE',
    description: 'Digital multimeter for voltage, current, and resistance measurement',
    imageUrl: null,
    maxBorrowDuration: '7 days',
    items: [
      { id: '5', rfidTag: 'RFID-MUL-001', status: 'BORROWED', holderName: 'Jason', holderEmail: 'jason@example.com', dueAt: '2026-02-20T07:42:21Z', homeLocation: 'Cabinet B' },
      { id: '6', rfidTag: 'RFID-MUL-002', status: 'BORROWED', holderName: 'Alice', holderEmail: 'alice@example.com', dueAt: '2026-03-01T07:42:21Z', homeLocation: 'Cabinet B' },
    ],
  },
  {
    id: 4,
    name: 'Soldering Station',
    category: 'TOOL',
    description: 'Temperature controlled soldering station with various tips',
    imageUrl: null,
    maxBorrowDuration: '14 days',
    items: [
      { id: '7', rfidTag: 'RFID-SOL-001', status: 'MAINTENANCE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Workshop' },
    ],
  },
  {
    id: 5,
    name: '3D Printer Filament',
    category: 'CONSUMABLE',
    description: 'PLA filament 1.75mm in various colors',
    imageUrl: null,
    maxBorrowDuration: '30 days',
    items: [
      { id: '8', rfidTag: 'RFID-FIL-001', status: 'AVAILABLE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Storage' },
      { id: '9', rfidTag: 'RFID-FIL-002', status: 'AVAILABLE', holderName: null, holderEmail: null, dueAt: null, homeLocation: 'Storage' },
    ],
  },
]

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: 'ALL', label: '全部', icon: '🔍' },
  { key: 'TOOL', label: '工具', icon: '🔧' },
  { key: 'DEVICE', label: '设备', icon: '🔌' },
  { key: 'CONSUMABLE', label: '耗材', icon: '📦' },
]

function StatusBadge({ status, dueAt }: { status: ItemStatus; dueAt: string | null }) {
  const isOverdue = dueAt && new Date(dueAt) < new Date()
  
  const configs = {
    AVAILABLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: '可借' },
    BORROWED: { 
      bg: isOverdue ? 'bg-red-100' : 'bg-amber-100', 
      text: isOverdue ? 'text-red-700' : 'text-amber-700',
      border: isOverdue ? 'border-red-200' : 'border-amber-200',
      label: isOverdue ? '已逾期' : '已借出'
    },
    MISSING: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: '丢失' },
    MAINTENANCE: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: '维护中' },
  }
  
  const config = configs[status]
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'BORROWED' ? (isOverdue ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-500'}`} />
      {config.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const icons: Record<string, string> = { TOOL: '🔧', DEVICE: '🔌', CONSUMABLE: '📦' }
  const labels: Record<string, string> = { TOOL: '工具', DEVICE: '设备', CONSUMABLE: '耗材' }
  
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
      <span className="mr-1">{icons[category] || '📎'}</span>
      {labels[category] || category}
    </span>
  )
}

export default function ToolsGalleryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('ALL')

  // 过滤工具
  const filteredTools = useMemo(() => {
    return mockTools.filter((tool) => {
      // 分类过滤
      if (selectedCategory !== 'ALL' && tool.category !== selectedCategory) {
        return false
      }
      
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = tool.name.toLowerCase().includes(query)
        const matchDesc = tool.description?.toLowerCase().includes(query)
        const matchLocation = tool.items.some(i => i.homeLocation.toLowerCase().includes(query))
        const matchRfid = tool.items.some(i => i.rfidTag.toLowerCase().includes(query))
        
        return matchName || matchDesc || matchLocation || matchRfid
      }
      
      return true
    })
  }, [searchQuery, selectedCategory])

  // 统计
  const stats = useMemo(() => {
    const totalTypes = filteredTools.length
    const totalItems = filteredTools.reduce((sum, t) => sum + t.items.length, 0)
    const availableItems = filteredTools.reduce((sum, t) => sum + t.items.filter(i => i.status === 'AVAILABLE').length, 0)
    return { totalTypes, totalItems, availableItems }
  }, [filteredTools])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 - 固定 */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* 标题栏 */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">工具库</h1>
              <p className="text-sm text-gray-500">
                共 {stats.totalTypes} 种工具 · {stats.totalItems} 个个体 · {stats.availableItems} 个可借
              </p>
            </div>
            <Link
              href="/tool-types"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理类型
            </Link>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索工具名称、描述、位置或 RFID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border-0 bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 分类筛选 */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 工具 Gallery */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
            <div className="text-6xl">🔍</div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">未找到匹配的工具</h3>
            <p className="mt-1 text-gray-500">尝试调整搜索词或筛选条件</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL') }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              清除筛选
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTools.map((tool) => {
              const availableCount = tool.items.filter(i => i.status === 'AVAILABLE').length
              
              return (
                <div key={tool.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  {/* 工具类型头部 */}
                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      {/* 图片区域 */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {tool.imageUrl ? (
                          <img src={tool.imageUrl} alt={tool.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
                            {tool.category === 'TOOL' && '🔧'}
                            {tool.category === 'DEVICE' && '🔌'}
                            {tool.category === 'CONSUMABLE' && '📦'}
                          </div>
                        )}
                      </div>

                      {/* 工具信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
                          <CategoryBadge category={tool.category} />
                          <span className="text-sm text-gray-500">
                            最长借用 {tool.maxBorrowDuration}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-gray-600 line-clamp-2">{tool.description || '暂无描述'}</p>
                        
                        {/* 统计徽章 */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {availableCount} 可借
                          </span>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            共 {tool.items.length} 个
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 个体列表 */}
                  <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      个体清单 · 存放于 {tool.items[0]?.homeLocation || 'N/A'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tool.items.map((item) => (
                        <div
                          key={item.id}
                          className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                            item.status === 'AVAILABLE'
                              ? 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                              : item.status === 'BORROWED'
                              ? 'border-amber-200 bg-amber-50/50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <StatusBadge status={item.status} dueAt={item.dueAt} />
                          <span className="font-mono text-xs text-gray-500">{item.rfidTag}</span>
                          
                          {/* 悬停提示 */}
                          {item.status === 'BORROWED' && item.holderName && (
                            <div className="absolute bottom-full left-0 mb-2 hidden w-max max-w-xs rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                              <div>借用人: {item.holderName}</div>
                              <div>邮箱: {item.holderEmail}</div>
                              <div>应还: {item.dueAt ? new Date(item.dueAt).toLocaleDateString('zh-CN') : '-'}</div>
                              <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-gray-900" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
