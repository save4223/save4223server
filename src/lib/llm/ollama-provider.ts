/**
 * Ollama LLM Provider
 * Local LLM inference using Ollama
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

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama' as const
  private baseUrl: string
  private embedModel: string
  private chatModel: string

  constructor(config: LLMConfig) {
    this.baseUrl = config.ollamaBaseUrl || 'http://localhost:11434'
    this.embedModel = config.ollamaEmbedModel || 'nomic-embed-text'
    this.chatModel = config.ollamaChatModel || 'llama3.2'
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.embedModel,
        prompt: text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama embedding failed: ${error}`)
    }

    const data = await response.json()
    return {
      embedding: data.embedding as number[],
    }
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // Ollama doesn't have a batch endpoint, so we process in parallel
    const results = await Promise.all(texts.map((text) => this.generateEmbedding(text)))
    return results
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResult> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.chatModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
        format: options?.responseFormat === 'json' ? 'json' : undefined,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama chat failed: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.message.content as string,
      usage: data.eval_count
        ? {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
          }
        : undefined,
    }
  }

  async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.chatModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 2048,
        },
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama chat stream failed: ${error}`)
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
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.message?.content) {
                yield data.message.content
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    // Build the reranking prompt
    const candidateList = candidates
      .map((c, i) => `${i + 1}. ${c.name}: ${c.description || 'No description'} [${c.category || 'Unknown'}]`)
      .join('\n')

    const systemPrompt = `You are a tool recommendation expert. Given a user's project and a list of candidate tools, score each tool's relevance from 0-100 based on:
- Task fit: How well does this tool help complete the project?
- Skill appropriateness: Is this tool suitable for general users?
- Practical utility: Is this the right tool for the job, or is there a better alternative?

You must respond with valid JSON in this exact format:
{"scores": [{"id": <number|string>, "score": <0-100>, "reason": "<brief explanation>"}]}`

    const userPrompt = `Project: "${query}"

Candidate tools:
${candidateList}

Score each tool and respond with JSON.`

    const result = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, responseFormat: 'json' }
    )

    // Parse the JSON response
    try {
      // Extract JSON from potentially markdown-wrapped response
      let jsonStr = result.content.trim()
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?|\n?```/g, '')
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?|\n?```/g, '')
      }

      const parsed = JSON.parse(jsonStr) as { scores: Array<{ id: number | string; score: number; reason: string }> }

      return parsed.scores.map((s) => ({
        id: s.id,
        score: Math.max(0, Math.min(100, s.score)),
        reason: s.reason,
      }))
    } catch (e) {
      console.error('Failed to parse rerank response:', result.content, e)
      // Fallback: return neutral scores
      return candidates.map((c) => ({
        id: c.id,
        score: 50,
        reason: 'Unable to score',
      }))
    }
  }
}
