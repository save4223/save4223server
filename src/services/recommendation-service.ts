/**
 * Recommendation Service
 * Full RAG pipeline for tool recommendations
 */

import { rerank, type RerankOptions, type RankedItem } from './reranker'
import { getLLMProvider, type Message } from '../lib/llm'
import { db } from '../db'
import { items, locations } from '../db/schema'
import { sql, eq } from 'drizzle-orm'

export interface RecommendationRequest {
  query: string
  options?: RerankOptions
}

export interface ToolWithAvailability {
  id: number
  name: string
  description: string | null
  category: string | null
  imageUrl: string | null
  availableCount: number
  totalCount: number
  locations: Array<{ id: number; name: string; type: string }>
}

export interface RecommendationResult {
  tools: ToolWithAvailability[]
  rankedItems: RankedItem[]
  query: string
  explanation: string
}

/**
 * Get availability and location info for recommended tools
 */
async function enrichToolData(itemTypeIds: number[]): Promise<Map<number, ToolWithAvailability>> {
  if (itemTypeIds.length === 0) {
    return new Map()
  }

  // Get items with their locations
  const results = await db.execute(sql`
    SELECT
      it.id as item_type_id,
      it.name,
      it.description,
      it.category,
      it.image_url,
      COUNT(i.id) as total_count,
      COUNT(i.id) FILTER (WHERE i.status = 'AVAILABLE') as available_count,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', l.id,
            'name', l.name,
            'type', l.type
          )
        ) FILTER (WHERE l.id IS NOT NULL),
        '[]'::json
      ) as locations
    FROM item_types it
    LEFT JOIN items i ON i.item_type_id = it.id
    LEFT JOIN locations l ON i.home_location_id = l.id
    WHERE it.id IN ${sql`(${sql.join(itemTypeIds.map(id => sql`${id}`), sql`, `)})`}
    GROUP BY it.id, it.name, it.description, it.category, it.image_url
  `)

  const map = new Map<number, ToolWithAvailability>()

  for (const row of results.rows) {
    const id = row.item_type_id as number
    map.set(id, {
      id,
      name: row.name as string,
      description: row.description as string | null,
      category: row.category as string | null,
      imageUrl: row.image_url as string | null,
      availableCount: Number(row.available_count),
      totalCount: Number(row.total_count),
      locations: row.locations as Array<{ id: number; name: string; type: string }>,
    })
  }

  return map
}

/**
 * Generate explanation for recommendations using LLM
 */
async function generateExplanation(
  query: string,
  tools: ToolWithAvailability[]
): Promise<string> {
  if (tools.length === 0) {
    return "I couldn't find any relevant tools for your project. Try describing your project in more detail or with different terms."
  }

  const provider = getLLMProvider()

  const toolDescriptions = tools
    .map(
      (t, i) =>
        `${i + 1}. **${t.name}** (${t.category || 'General'})\n   - ${t.description || 'No description available'}\n   - Available: ${t.availableCount}/${t.totalCount}`
    )
    .join('\n\n')

  const systemPrompt = `You are a helpful lab assistant. Given a user's project description and a list of recommended tools, provide a concise explanation of why these tools are recommended and how they might be used for the project.

Keep your response:
- Friendly and encouraging
- Concise (2-3 paragraphs max)
- Practical and actionable
- Mention safety considerations if relevant (e.g., for power tools, chemicals)

Format your response in Markdown.`

  const userMessage = `Project: "${query}"

Recommended tools:
${toolDescriptions}

Please explain why these tools are recommended for this project.`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  const result = await provider.chat(messages, { temperature: 0.7, maxTokens: 500 })
  return result.content
}

/**
 * Get tool recommendations for a project
 */
export async function getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
  const { query, options } = request

  // Step 1: Rerank candidates
  const rankedItems = await rerank(query, options)

  // Step 2: Enrich with availability and location data
  const itemTypeIds = rankedItems.map((item) => item.id)
  const enrichedData = await enrichToolData(itemTypeIds)

  // Step 3: Build final tool list preserving ranking order
  const tools: ToolWithAvailability[] = []
  for (const item of rankedItems) {
    const data = enrichedData.get(item.id)
    if (data) {
      tools.push(data)
    }
  }

  // Step 4: Generate explanation
  const explanation = await generateExplanation(query, tools)

  return {
    tools,
    rankedItems,
    query,
    explanation,
  }
}

/**
 * Stream explanation as it's generated
 */
export async function* streamRecommendationExplanation(
  query: string,
  tools: ToolWithAvailability[]
): AsyncIterable<string> {
  if (tools.length === 0) {
    yield "I couldn't find any relevant tools for your project. Try describing your project in more detail or with different terms."
    return
  }

  const provider = getLLMProvider()

  const toolDescriptions = tools
    .map(
      (t, i) =>
        `${i + 1}. **${t.name}** (${t.category || 'General'})\n   - ${t.description || 'No description available'}\n   - Available: ${t.availableCount}/${t.totalCount}`
    )
    .join('\n\n')

  const systemPrompt = `You are a helpful lab assistant. Given a user's project description and a list of recommended tools, provide a concise explanation of why these tools are recommended and how they might be used.

Keep your response:
- Friendly and encouraging
- Concise (2-3 paragraphs max)
- Practical and actionable
- Mention safety considerations if relevant

Format your response in Markdown.`

  const userMessage = `Project: "${query}"

Recommended tools:
${toolDescriptions}

Please explain why these tools are recommended for this project.`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  for await (const chunk of provider.chatStream(messages, { temperature: 0.7, maxTokens: 500 })) {
    yield chunk
  }
}
