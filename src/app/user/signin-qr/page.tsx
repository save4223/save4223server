'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, ArrowLeft, AlertCircle, Smartphone, RefreshCw } from 'lucide-react'

interface SignInToken {
  userId: string
  fullName: string
  email: string
  role: string
  expiresAt: string
}

export default function SignInQRPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [signInToken, setSignInToken] = useState<SignInToken | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    generateToken()
  }, [refreshCount])

  async function generateToken() {
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/user/signin-token', { method: 'POST' })

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate QR code')
      }

      const data = await res.json()
      setSignInToken(data)
      const expiresIn = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000))
      setCountdown(expiresIn)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code')
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const qrCodeUrl = signInToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
        type: 'SIGNIN',
        user_id: signInToken.userId,
        name: signInToken.fullName,
        exp: signInToken.expiresAt,
      }))}`
    : null

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/user/profile" className="btn btn-ghost btn-sm w-fit">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Link>
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-accent" />
              <h1 className="text-xl sm:text-2xl font-bold text-accent">Sign-In QR Code</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">Dismiss</button>
          </div>
        )}

        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5" />
              <h2 className="card-title text-lg">Scan to Sign In</h2>
            </div>

            {signInToken && (
              <>
                {/* User Info */}
                <div className="bg-base-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-accent text-accent-content rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-lg">{signInToken.fullName.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{signInToken.fullName}</p>
                      <p className="text-sm text-base-content/60">{signInToken.email}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img
                      src={qrCodeUrl || ''}
                      alt="Sign-In QR Code"
                      className="w-64 h-64"
                    />
                  </div>

                  <p className="text-lg font-semibold mb-2">Present this QR code to the scanner</p>
                  <p className="text-base-content/60 mb-4">
                    The edge device will scan this code to identify you
                  </p>

                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-sm text-base-content/60">Refreshes in:</span>
                    <span className={`font-mono font-bold ${countdown < 30 ? 'text-error' : 'text-accent'}`}>
                      {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                  </div>

                  <button
                    onClick={() => { setRefreshCount(c => c + 1) }}
                    disabled={generating}
                    className="btn btn-accent"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Refreshing...' : 'Refresh QR Code'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 alert alert-info">
          <Smartphone className="w-5 h-5" />
          <div>
            <p className="font-semibold">How to use:</p>
            <ol className="text-sm mt-2 space-y-1">
              <li>1. Show this QR code to the edge device scanner</li>
              <li>2. The device will identify you and grant access</li>
              <li>3. The QR code auto-refreshes every 3 minutes for security</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}
