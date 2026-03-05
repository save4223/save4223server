import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations, streamRecommendationExplanation } from '@/services/recommendation-service'
import { rerank } from '@/services/reranker'

/**
 * POST /api/user/recommendations
 * Get tool recommendations for a project description
 *
 * Body: {
 *   query: string,
 *   options?: {
 *     topK?: number,
 *     skipLLMRerank?: boolean,
 *     weights?: { semantic, availability, category, popularity, llm }
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const query = body.query.trim()
    const options = body.options || {}

    // Validate query length
    if (query.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a more detailed project description (at least 10 characters)' },
        { status: 400 }
      )
    }

    if (query.length > 2000) {
      return NextResponse.json(
        { error: 'Project description is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Get recommendations
    const result = await getRecommendations({
      query,
      options: {
        topK: options.topK || 5,
        skipLLMRerank: options.skipLLMRerank || false,
        weights: options.weights,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/recommendations/stream
 * Stream the explanation text
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    // First get ranked items (fast)
    const rankedItems = await rerank(query, { topK: 5 })

    // Then stream the explanation
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // First, send the tools as JSON
        const toolsData = JSON.stringify({ type: 'tools', tools: rankedItems })
        controller.enqueue(encoder.encode(`data: ${toolsData}\n\n`))

        // Then stream the explanation
        try {
          for await (const chunk of streamRecommendationExplanation(query, [])) {
            const textData = JSON.stringify({ type: 'text', chunk })
            controller.enqueue(encoder.encode(`data: ${textData}\n\n`))
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        } catch (e) {
          const errorData = JSON.stringify({ type: 'error', message: (e as Error).message })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Stream error:', error)
    return NextResponse.json(
      { error: 'Failed to stream recommendations' },
      { status: 500 }
    )
  }
}
