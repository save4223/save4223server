import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { itemTypes, items } from '@/db/schema'
import { sql } from 'drizzle-orm'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 获取统计数据
  const stats = await db.select({
    totalTypes: sql<number>`count(distinct ${itemTypes.id})`,
    totalItems: sql<number>`count(${items.id})`,
    availableItems: sql<number>`count(case when ${items.status} = 'AVAILABLE' then 1 end)`,
  })
    .from(itemTypes)
    .leftJoin(items, sql<number>`true`)

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            🔧 Smart Lab Inventory
          </h1>
          <p className="mb-8 text-xl text-gray-600">智能实验室工具管理系统</p>

          {user ? (
            <div className="flex items-center justify-center gap-4">
              <span className="rounded-full bg-green-100 px-4 py-2 text-green-800">
                ✅ {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  退出登录
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              登录
            </Link>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Link
            href="/tools"
            className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🔧</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats[0]?.totalTypes || 0}
            </div>
            <div className="mt-2 text-gray-600">工具类型</div>
            <div className="mt-4 text-sm text-blue-600 group-hover:underline">
              查看全部 →
            </div>
          </Link>

          <Link
            href="/tools"
            className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">📦</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats[0]?.totalItems || 0}
            </div>
            <div className="mt-2 text-gray-600">工具总数</div>
            <div className="mt-4 text-sm text-purple-600 group-hover:underline">
              查看全部 →
            </div>
          </Link>

          <Link
            href="/tools"
            className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">✅</div>
            <div className="text-3xl font-bold text-green-600">
              {stats[0]?.availableItems || 0}
            </div>
            <div className="mt-2 text-gray-600">可借数量</div>
            <div className="mt-4 text-sm text-green-600 group-hover:underline">
              立即借用 →
            </div>
          </Link>
        </div>

        {/* 功能模块 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/tools"
            className="flex items-center rounded-xl bg-white p-6 shadow transition-all hover:shadow-lg"
          
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl">
              🔧
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-900">工具库</h2>
              <p className="mt-2 text-gray-600">
                浏览所有可用工具，按类型查看，查看借用状态
              </p>
            </div>
          </Link>

          <Link
            href="/tool-types"
            className="flex items-center rounded-xl bg-white p-6 shadow transition-all hover:shadow-lg"
          
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-3xl">
              📋
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-900">工具类型</h2>
              <p className="mt-2 text-gray-600">
                管理工具分类，设置借用规则和归还期限
              </p>
            </div>
          </Link>

          <div className="flex items-center rounded-xl bg-white p-6 shadow"
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-3xl">
              📊
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-900">借用记录</h2>
              <p className="mt-2 text-gray-600">查看历史借用记录和当前借用状态（开发中）</p>
            </div>
          </div>

          <div className="flex items-center rounded-xl bg-white p-6 shadow"
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-3xl">
              🚪
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-900">智能柜管理</h2>
              <p className="mt-2 text-gray-600">管理储物柜位置和访问权限（开发中）</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Save4223 Smart Inventory System v2.0</p>
          <p className="mt-1">Next.js + Supabase + Drizzle ORM</p>
        </div>
      </div>
    </main>
  )
}
