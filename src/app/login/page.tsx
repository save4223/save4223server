'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-base-100 p-8 shadow-lg border border-base-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🔧</div>
          <h1 className="text-3xl font-bold text-accent">Smart Lab Inventory</h1>
          <p className="mt-2 text-base-content/70">Sign in to your account or create a new one</p>
        </div>

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="form-control">
              <label htmlFor="email" className="label">
                <span className="label-text">Email address</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input input-bordered w-full"
                placeholder="you@example.com"
              />
            </div>

            <div className="form-control">
              <label htmlFor="password" className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input input-bordered w-full"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div
              className={`alert ${message.includes('error') || message.includes('Error') || message.includes('Invalid') ? 'alert-error' : 'alert-success'}`}
            >
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="btn btn-accent flex-1"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="btn btn-outline flex-1"
            >
              Sign Up
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="btn btn-ghost btn-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
