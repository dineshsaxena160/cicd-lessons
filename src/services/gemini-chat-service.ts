import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages'
import type { ChatMessage, ChatRequest } from '../models/chat'
import { SYSTEM_PROMPT } from '../prompts/system-prompt'
import { ChatServiceError, type ChatService } from './chat-service'

export { ChatServiceError } from './chat-service'

export const MODEL_NAME = 'gemma-4-26b-a4b-it'
export const MAX_OUTPUT_TOKENS = 1024

interface GeminiModelLike {
  invoke(messages: BaseMessage[]): Promise<{ content: unknown }>
}

interface GeminiChatServiceOptions {
  apiKey?: string
  model?: GeminiModelLike
}

function toProviderMessage(message: ChatMessage): HumanMessage | AIMessage {
  return message.role === 'user' ? new HumanMessage(message.content) : new AIMessage(message.content)
}

function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }

      if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
        return part.text
      }

      return ''
    })
    .join('')
}

export class GeminiChatService implements ChatService {
  private readonly apiKey: string
  private readonly model?: GeminiModelLike

  constructor(options: GeminiChatServiceOptions = {}) {
    const configuredKey = options.apiKey ?? import.meta.env.VITE_GOOGLE_API_KEY ?? ''
    this.apiKey = configuredKey.trim()

    if (options.model) {
      this.model = options.model
    } else if (this.apiKey) {
      this.model = new ChatGoogleGenerativeAI({
        apiKey: this.apiKey,
        model: MODEL_NAME,
        temperature: 0,
        maxRetries: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      })
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  async sendMessage(request: ChatRequest): Promise<string> {
    if (!this.isConfigured()) {
      throw new ChatServiceError('missing-configuration', 'Missing browser configuration.')
    }

    if (!this.model) {
      throw new ChatServiceError('request-failed', 'The chat model is unavailable.')
    }

    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...request.messages.map(toProviderMessage),
    ]

    try {
      const result = await this.model.invoke(messages)
      const text = extractText(result.content).trim()
      if (!text) {
        throw new ChatServiceError('empty-response', 'The model returned no usable answer.')
      }

      return text
    } catch (error) {
      if (error instanceof ChatServiceError) {
        throw error
      }

      throw new ChatServiceError('request-failed', 'The model request failed.')
    }
  }
}

export type { GeminiModelLike, GeminiChatServiceOptions }
