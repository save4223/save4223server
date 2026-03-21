'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Send, Package, MapPin, AlertCircle, CheckCircle, Wrench, Loader2, Search, BarChart3, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Tool {
  id: number
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  availableCount: number
  totalCount: number
  locations: Array<{ id: number; name: string; type: string }>
}

interface RankedItem {
  id: number
  name: string
  description: string | null
  category: string | null
  finalScore: number
  scores: {
    semantic: number
    availability: number
    popularity: number
    llm: number
  }
}

interface RecommendationResult {
  tools: Tool[]
  rankedItems: RankedItem[]
  query: string
  explanation: string
}

function ToolCard({ tool }: { tool: Tool }) {
  const availabilityPercent = tool.totalCount > 0 ? (tool.availableCount / tool.totalCount) * 100 : 0

  return (
    <div className="card bg-base-200 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="avatar placeholder">
            <div className="bg-base-300 rounded-lg w-12 h-12 flex items-center justify-center">
              {tool.imageUrl ? (
                <img src={tool.imageUrl} alt={tool.name} className="rounded-lg" />
              ) : (
                <Wrench className="w-6 h-6 text-base-content/50" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
            <p className="text-xs text-base-content/60 line-clamp-2 mt-1">
              {tool.description || 'No description'}
            </p>
          </div>

          {/* Category Badge */}
          {tool.category && (
            <span className="badge badge-ghost badge-sm">{tool.category}</span>
          )}
        </div>

        {/* Availability */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-base-content/60">Availability</span>
            <span className={tool.availableCount > 0 ? 'text-success' : 'text-error'}>
              {tool.availableCount}/{tool.totalCount} available
            </span>
          </div>
          <progress
            className={`progress progress-sm ${tool.availableCount > 0 ? 'progress-success' : 'progress-error'}`}
            value={availabilityPercent}
            max={100}
          />
        </div>

        {/* Locations */}
        {tool.locations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tool.locations.slice(0, 3).map((loc) => (
              <span key={loc.id} className="badge badge-outline badge-sm gap-1">
                <MapPin className="w-3 h-3" />
                {loc.name}
              </span>
            ))}
            {tool.locations.length > 3 && (
              <span className="badge badge-ghost badge-sm">+{tool.locations.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBreakdown({ item }: { item: RankedItem }) {
  return (
    <div className="tooltip tooltip-right" data-tip={`Score: ${(item.finalScore * 100).toFixed(0)}%`}>
      <div className="flex items-center gap-2 text-xs text-base-content/50">
        <div className="radial-progress text-accent" style={{ '--value': item.finalScore * 100, '--size': '24px' } as React.CSSProperties}>
        </div>
      </div>
    </div>
  )
}

const PROGRESS_STEPS = [
  {
    icon: Search,
    label: 'Searching tool database',
    description: 'Finding semantically similar tools...',
  },
  {
    icon: BarChart3,
    label: 'Analyzing relevance',
    description: 'Scoring availability, popularity, and fit...',
  },
  {
    icon: MessageSquare,
    label: 'Generating recommendations',
    description: 'Creating personalized explanation...',
  },
] as const

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 sm:gap-4">
        {PROGRESS_STEPS.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const Icon = step.icon

          return (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-accent text-accent-content scale-110'
                    : isCompleted
                      ? 'bg-success text-success-content'
                      : 'bg-base-300 text-base-content/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              {index < PROGRESS_STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-1 mx-1 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-success' : 'bg-base-300'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current step label */}
      <div className="text-center">
        <p className="font-medium text-base-content">
          {PROGRESS_STEPS[currentStep].label}
        </p>
        <p className="text-sm text-base-content/60 mt-1">
          {PROGRESS_STEPS[currentStep].description}
        </p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!query.trim() || query.trim().length < 10) {
      setError('Please describe your project in more detail (at least 10 characters)')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setProgressStep(0)

    // Start progress animation timer
    // Cycle through steps every 3 seconds, but don't go past the last step
    progressTimerRef.current = setInterval(() => {
      setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev))
    }, 3000)

    try {
      const res = await fetch('/api/user/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to get recommendations')
      }

      const data: RecommendationResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      // Stop progress timer
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      setLoading(false)
    }
  }

  function handleReset() {
    setQuery('')
    setResult(null)
    setError(null)
    setProgressStep(0)
    inputRef.current?.focus()
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary border-b border-primary-content/10">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/" className="btn btn-ghost btn-sm w-fit">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
            </Link>
            <div className="flex-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              <h1 className="text-xl sm:text-2xl font-bold text-accent">AI Tool Recommender</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Input Section */}
        <div className="card bg-base-100 border border-base-300 mb-6">
          <div className="card-body">
            <p className="text-base-content/70 mb-4">
              Describe your project and I'll recommend the best tools from our inventory.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-control">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., I want to build a wooden drone frame with carbon fiber reinforcements..."
                  className="textarea textarea-bordered w-full h-24 resize-none"
                  maxLength={2000}
                  disabled={loading}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    {query.length}/2000 characters
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-error mt-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="btn btn-accent flex-1 gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analyzing...' : 'Get Recommendations'}
                </button>
               
                {result && (
                  <button type="button" onClick={handleReset} className="btn btn-ghost">
                    New Query
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {loading && !result && (
          <div className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              <ProgressIndicator currentStep={progressStep} />
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Explanation */}
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg mb-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Recommendation
                </h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-base-content">{children}</strong>,
                    }}
                  >
                    {result.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Tools Grid */}
            {result.tools.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Recommended Tools ({result.tools.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.tools.map((tool, index) => (
                    <div key={tool.id} className="relative">
                      {index === 0 && (
                        <div className="absolute -top-2 -left-2 badge badge-accent badge-sm z-10">
                          Top Pick
                        </div>
                      )}
                      <ToolCard tool={tool} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card bg-base-200">
                <div className="card-body items-center text-center">
                  <AlertCircle className="w-12 h-12 text-base-content/30 mb-2" />
                  <p>No tools found matching your project description.</p>
                  <p className="text-sm text-base-content/60">Try describing your project differently.</p>
                </div>
              </div>
            )}

            {/* Score Details (Expandable) */}
            {result.rankedItems.length > 0 && (
              <details className="collapse collapse-arrow bg-base-200">
                <summary className="collapse-title font-medium">
                  Scoring Details
                </summary>
                <div className="collapse-content">
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Final</th>
                          <th>Semantic</th>
                          <th>Availability</th>
                          <th>Popularity</th>
                          <th>LLM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.rankedItems.map((item) => (
                          <tr key={item.id}>
                            <td className="font-medium">{item.name}</td>
                            <td>{(item.finalScore * 100).toFixed(0)}%</td>
                            <td>{(item.scores.semantic * 100).toFixed(0)}%</td>
                            <td>{(item.scores.availability * 100).toFixed(0)}%</td>
                            <td>{(item.scores.popularity * 100).toFixed(0)}%</td>
                            <td>{(item.scores.llm * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && (
          <div className="card bg-base-200">
            <div className="card-body items-center text-center py-12">
              <Sparkles className="w-16 h-16 text-base-content/20 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Describe Your Project</h2>
              <p className="text-base-content/60 max-w-md">
                Tell me what you're working on, and I'll find the perfect tools from our inventory.
                Include details about materials, techniques, and your skill level for better recommendations.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => setQuery("I want to build a wooden drone frame")}
                  className="btn btn-ghost btn-sm"
                >
                  Wooden drone frame
                </button>
                <button
                  onClick={() => setQuery("I need to repair a circuit board with SMD components")}
                  className="btn btn-ghost btn-sm"
                >
                  Circuit board repair
                </button>
                <button
                  onClick={() => setQuery("I'm making a 3D printed enclosure for my Raspberry Pi")}
                  className="btn btn-ghost btn-sm"
                >
                  3D printed enclosure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
