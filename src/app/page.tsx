import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const signOut = async () => {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Welcome to Save4223 Server
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Next.js + Supabase Fullstack Application
        </p>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 p-6">
              <p className="text-green-800">
                ✅ Logged in as <strong>{user.email}</strong>
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-yellow-50 p-6">
              <p className="text-yellow-800">
                ⚠️ You are not logged in
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        )}

        <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">🔐 Authentication</h3>
            <p className="text-gray-600">Secure user authentication with Supabase Auth</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">🗄️ PostgreSQL</h3>
            <p className="text-gray-600">Powerful relational database with real-time subscriptions</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">⚡ Edge Functions</h3>
            <p className="text-gray-600">Serverless functions for custom business logic</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">🔔 Realtime</h3>
            <p className="text-gray-600">Live data synchronization across clients</p>
          </div>
        </div>
      </div>
    </main>
  )
}
