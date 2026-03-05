/**
 * LLM Provider Factory
 * Creates and returns the appropriate LLM provider based on configuration
 */

import { OllamaProvider } from './ollama-provider'
import { OpenAIProvider } from './openai-provider'
import type { LLMProvider, LLMConfig, LLMProviderType } from './types'
import { getLLMConfig } from './types'

// Singleton instance
let _provider: LLMProvider | null = null

/**
 * Get the configured LLM provider instance (singleton)
 */
export function getLLMProvider(): LLMProvider {
  if (_provider) {
    return _provider
  }

  const config = getLLMConfig()
  _provider = createLLMProvider(config)
  return _provider
}

/**
 * Create a new LLM provider instance
 */
export function createLLMProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented. Use "ollama" or "openai".')
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`)
  }
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetLLMProvider(): void {
  _provider = null
}

// Re-export types
export * from './types'
export { OllamaProvider } from './ollama-provider'
export { OpenAIProvider } from './openai-provider'
