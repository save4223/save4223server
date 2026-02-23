'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PairingToken {
  token: string
  expiresAt: string
}

interface UserCard {
  id: number
  cardUid: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function PairCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [pairingToken, setPairingToken] = useState<PairingToken | null>(null)
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchUserCards()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (pairingToken) {
      const expiresIn = Math.max(0, Math.floor((new Date(pairingToken.expiresAt).getTime() - Date.now()) / 1000))
      setCountdown(expiresIn)
    }
  }, [pairingToken])

  async function fetchUserCards() {
    try {
      const res = await fetch('/api/user/cards')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to load cards')
      }
      const data = await res.json()
      setUserCards(data.cards || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function generatePairingCode() {
    setGenerating(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/pairing-token', {
        method: 'POST',
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate pairing code')
      }
      
      const data = await res.json()
      setPairingToken(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code')
    } finally {
      setGenerating(false)
    }
  }

  async function revokeCard(cardId: number) {
    if (!confirm('Are you sure you want to remove this card?')) return
    
    try {
      const res = await fetch(`/api/user/cards/${cardId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) throw new Error('Failed to revoke card')
      
      setUserCards(userCards.filter(c => c.id !== cardId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke card')
    }
  }

  // Generate QR code URL using QR Server API
  const qrCodeUrl = pairingToken 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
        type: 'CARD_PAIRING',
        token: pairingToken.token,
        exp: pairingToken.expiresAt,
      }))}`
    : null

  if (loading) {
    return (
      <main className="min-h-screen bg-base-100">
        <div className="flex h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-accent"></span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href="/user/profile" className="btn btn-ghost btn-sm w-fit">
                ← Back
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-accent">💳 Pair NFC Card</h1>
                <p className="text-accent/70 text-sm mt-1 hidden sm:block">Link your NFC card to your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Error */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">Dismiss</button>
          </div>
        )}

        {/* Current Cards Section */}
        <div className="card bg-base-100 shadow-lg border border-base-300 mb-8">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">🔗 Linked Cards</h2>
            
            {userCards.length === 0 ? (
              <div className="text-center py-8 bg-base-200 rounded-lg">
                <div className="text-4xl mb-2">💳</div>
                <p className="text-base-content/60">No cards linked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💳</div>
                      <div>
                        <p className="font-mono font-semibold">{card.cardUid}</p>
                        <p className="text-xs text-base-content/60">
                          Added {new Date(card.createdAt).toLocaleDateString()}
                          {card.lastUsedAt && ` • Last used ${new Date(card.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {card.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-ghost">Inactive</span>
                      )}
                      <button
                        onClick={() => revokeCard(card.id)}
                        className="btn btn-error btn-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pairing Section */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">📱 Pair New Card</h2>
            
            {!pairingToken ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📱💳</div>
                <p className="text-base-content/70 mb-6">
                  Generate a pairing code and scan it at any cabinet to link your NFC card.
                </p>
                <ol className="text-left text-sm text-base-content/60 mb-6 space-y-2 max-w-md mx-auto">
                  <li>1. Click "Generate Pairing Code" below</li>
                  <li>2. Go to any Smart Cabinet</li>
                  <li>3. Scan the QR code displayed on your phone</li>
                  <li>4. Tap your NFC card on the reader</li>
                  <li>5. Done! Your card is now linked</li>
                </ol>
                
                <button
                  onClick={generatePairingCode}
                  disabled={generating}
                  className="btn btn-accent btn-lg"
                >
                  {generating ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    '🔄 Generate Pairing Code'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt="Pairing QR Code" 
                      className="w-64 h-64"
                    />
                  )}
                </div>
                
                <p className="text-lg font-semibold mb-2">Scan at any cabinet</p>
                <p className="text-base-content/60 mb-4">
                  Then tap your NFC card to complete pairing
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-sm text-base-content/60">Expires in:</span>
                  <span className={`font-mono font-bold ${countdown < 30 ? 'text-error' : 'text-accent'}`}>
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={generatePairingCode}
                    disabled={generating}
                    className="btn btn-accent"
                  >
                    🔄 Regenerate
                  </button>
                  <button
                    onClick={() => setPairingToken(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 alert alert-info">
          <span>💡 Tip: You can link multiple NFC cards to your account. Each card can be used at any cabinet.</span>
        </div>
      </div>
    </main>
  )
}
