/**
 * LLM Provider Types and Interfaces
 * Supports switching between Ollama (local) and external providers (OpenAI, Anthropic)
 */

export type LLMProviderType = 'ollama' | 'openai' | 'anthropic'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
}

export interface ChatResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface RerankCandidate {
  id: number | string
  name: string
  description: string | null
  category: string | null
}

export interface RerankResult {
  id: number | string
  score: number
  reason: string
}

export interface EmbeddingResult {
  embedding: number[]
  tokens?: number
}

/**
 * LLM Provider Interface
 * All providers must implement this interface
 */
export interface LLMProvider {
  readonly name: LLMProviderType

  /**
   * Generate embedding for a single text
   */
  generateEmbedding(text: string): Promise<EmbeddingResult>

  /**
   * Generate embeddings for multiple texts (batch)
   */
  generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>

  /**
   * Chat completion (non-streaming)
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResult>

  /**
   * Chat completion with streaming
   */
  chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterable<string>

  /**
   * Rerank candidates based on query relevance
   */
  rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]>
}

/**
 * Provider configuration from environment
 */
export interface LLMConfig {
  provider: LLMProviderType
  // Ollama
  ollamaBaseUrl?: string
  ollamaEmbedModel?: string
  ollamaChatModel?: string
  // OpenAI
  openaiApiKey?: string
  openaiEmbedModel?: string
  openaiChatModel?: string
  // Anthropic
  anthropicApiKey?: string
  anthropicChatModel?: string
}

/**
 * Get LLM configuration from environment variables
 */
export function getLLMConfig(): LLMConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LLMProviderType) || 'ollama',
    // Ollama defaults
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL || 'mxbai-embed-large',
    ollamaChatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
    // OpenAI
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiEmbedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
    openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    // Anthropic
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicChatModel: process.env.ANTHROPIC_CHAT_MODEL || 'claude-3-haiku-20241022',
  }
}
