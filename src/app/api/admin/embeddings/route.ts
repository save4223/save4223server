import { NextRequest, NextResponse } from 'next/server'
import {
  generateMissingEmbeddings,
  regenerateAllEmbeddings,
  getEmbeddingStats,
} from '@/services/embedding-service'

/**
 * GET /api/admin/embeddings
 * Get embedding statistics
 */
export async function GET() {
  try {
    const stats = await getEmbeddingStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to get embedding stats:', error)
    return NextResponse.json({ error: 'Failed to get embedding stats' }, { status: 500 })
  }
}

/**
 * POST /api/admin/embeddings
 * Generate or regenerate embeddings
 * Body: { action: 'generate-missing' | 'regenerate-all' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'generate-missing'

    let result

    if (action === 'regenerate-all') {
      result = await regenerateAllEmbeddings()
    } else {
      result = await generateMissingEmbeddings()
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Failed to generate embeddings:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
