import Link from 'next/link'
import { db } from '@/db'
import { itemTypes, items, locations } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export default async function ToolsPage() {
  // 获取所有工具类型和统计
  const typesWithCount = await db.select({
    type: itemTypes,
    total: sql<number>`count(${items.id})`,
    available: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
    borrowed: sql<number>`count(case when ${items.status} = 'BORROWED' then 1 end)`,
  })
    .from(itemTypes)
    .leftJoin(items, eq(itemTypes.id, items.itemTypeId))
    .groupBy(itemTypes.id)

  // 获取最近借出的工具
  const recentItems = await db.query.items.findMany({
    limit: 10,
    with: {
      itemType: true,
      homeLocation: true,
    },
    orderBy: (items, { desc }) => [desc(items.updatedAt)],
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">工具库</h1>
              <p className="mt-1 text-sm text-gray-600">浏览所有可用工具和设备</p>
            </div>
            <Link
              href="/tool-types"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              管理工具类型
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {typesWithCount.map(({ type, total, available, borrowed }) => (
            <Link
              key={type.id}
              href={`/tools?type=${type.id}`}
              className="group relative overflow-hidden rounded-xl bg-white shadow transition-all hover:shadow-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-2xl">
                    {type.category === 'TOOL' && '🔧'}
                    {type.category === 'DEVICE' && '🔌'}
                    {type.category === 'CONSUMABLE' && '📦'}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {type.category}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {type.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {type.description || '暂无描述'}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    总计: <span className="font-semibold">{total}</span>
                  </span>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {available} 可借
                    </span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                      {borrowed} 借出
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            </Link>
          ))}
        </div>

        {/* 最近更新 */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">最近更新</h2>
          <div className="mt-4 overflow-hidden rounded-xl bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    工具名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    RFID标签
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    位置
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-xl">
                          {item.itemType?.category === 'TOOL' && '🔧'}
                          {item.itemType?.category === 'DEVICE' && '🔌'}
                          {item.itemType?.category === 'CONSUMABLE' && '📦'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.itemType?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.itemType?.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {item.rfidTag}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {item.homeLocation?.name || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          item.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'BORROWED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.status === 'MISSING'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'AVAILABLE' && '可借'}
                        {item.status === 'BORROWED' && '已借出'}
                        {item.status === 'MISSING' && '丢失'}
                        {item.status === 'MAINTENANCE' && '维护中'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
