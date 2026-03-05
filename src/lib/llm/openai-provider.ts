/**
 * OpenAI LLM Provider
 * External LLM via OpenAI API
 */

import type {
  LLMProvider,
  LLMConfig,
  Message,
  ChatOptions,
  ChatResult,
  RerankCandidate,
  RerankResult,
  EmbeddingResult,
} from './types'

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const
  private apiKey: string
  private embedModel: string
  private chatModel: string
  private baseUrl: string

  constructor(config: LLMConfig) {
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider')
    }
    this.apiKey = config.openaiApiKey
    this.embedModel = config.openaiEmbedModel || 'text-embedding-3-small'
    this.chatModel = config.openaiChatModel || 'gpt-4o-mini'
    this.baseUrl = 'https://api.openai.com/v1'
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embedModel,
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI embedding failed: ${error}`)
    }

    const data = await response.json()
    return {
      embedding: data.data[0].embedding as number[],
      tokens: data.usage?.total_tokens,
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // OpenAI supports batch embedding
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embedModel,
        input: texts,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI batch embedding failed: ${error}`)
    }

    const data = await response.json()
    return data.data.map((d: { embedding: number[] }, i: number) => ({
      embedding: d.embedding,
      tokens: data.usage?.total_tokens ? Math.ceil(data.usage.total_tokens / texts.length) : undefined,
    }))
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResult> {
    const body: Record<string, unknown> = {
      model: this.chatModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }

    if (options?.responseFormat === 'json') {
      body.response_format = { type: 'json_object' }
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI chat failed: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content as string,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const body: Record<string, unknown> = {
      model: this.chatModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI chat stream failed: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    const candidateList = candidates
      .map((c, i) => `${i + 1}. ${c.name}: ${c.description || 'No description'} [${c.category || 'Unknown'}]`)
      .join('\n')

    const systemPrompt = `You are a tool recommendation expert. Given a user's project and a list of candidate tools, score each tool's relevance from 0-100 based on:
- Task fit: How well does this tool help complete the project?
- Skill appropriateness: Is this tool suitable for general users?
- Practical utility: Is this the right tool for the job?

Respond with valid JSON only:
{"scores": [{"id": <number or string>, "score": <0-100>, "reason": "<brief explanation>"}]}`

    const userPrompt = `Project: "${query}"

Candidate tools:
${candidateList}

Score each tool and respond with JSON only.`

    const result = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, responseFormat: 'json' }
    )

    try {
      const parsed = JSON.parse(result.content) as {
        scores: Array<{ id: number | string; score: number; reason: string }>
      }

      return parsed.scores.map((s) => ({
        id: s.id,
        score: Math.max(0, Math.min(100, s.score)),
        reason: s.reason,
      }))
    } catch (e) {
      console.error('Failed to parse rerank response:', result.content, e)
      return candidates.map((c) => ({
        id: c.id,
        score: 50,
        reason: 'Unable to score',
      }))
    }
  }
}
