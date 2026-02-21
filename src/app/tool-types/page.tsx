import Link from 'next/link'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export default async function ToolTypesPage() {
  // 获取所有工具类型及其统计
  const types = await db.select({
    type: itemTypes,
    total: sql<number>`count(${items.id})`,
    available: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
  })
    .from(itemTypes)
    .leftJoin(items, eq(itemTypes.id, items.itemTypeId))
    .groupBy(itemTypes.id)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/tools"
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                ← 返回工具库
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">工具类型管理</h1>
                <p className="mt-1 text-sm text-gray-600">管理工具分类和借用规则</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-3xl font-bold text-blue-600">{types.length}</div>
            <div className="mt-1 text-sm text-gray-600">工具类型总数</div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-3xl font-bold text-green-600">
              {types.reduce((sum, t) => sum + t.available, 0)}
            </div>
            <div className="mt-1 text-sm text-gray-600">可借工具总数</div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="text-3xl font-bold text-purple-600">
              {types.reduce((sum, t) => sum + t.total, 0)}
            </div>
            <div className="mt-1 text-sm text-gray-600">工具实例总数</div>
          </div>
        </div>

        {/* 类型列表 */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  图片
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  类型名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  最大借用时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  工具数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  可用数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {types.map(({ type, total, available }) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
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
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                          {type.description || '暂无描述'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {type.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {type.maxBorrowDuration || '7 days'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {total}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      {available}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/tools?type=${type.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      查看工具
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 空状态 */}
        {types.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-12 text-center shadow">
            <div className="text-6xl">📦</div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">暂无工具类型</h3>
            <p className="mt-2 text-gray-500">请先创建工具类型</p>
          </div>
        )}
      </div>
    </main>
  )
}
