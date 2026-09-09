import type { ChatRequest } from '../models/chat'
import { ChatServiceError, type ChatService } from './chat-service'

interface FakeChatServiceOptions {
  configured?: boolean
  response?: string | ((request: ChatRequest) => string | Promise<string>)
  error?: 'request-failed' | 'empty-response'
}

function defaultResponse(request: ChatRequest): string {
  const question = request.messages.at(-1)?.content.toLowerCase() ?? ''

  if (question.includes('audit')) {
    return 'Audit requirements depend on your business facts. Please consult a CA for individualized guidance.'
  }

  if (question.includes('gst')) {
    return 'GST due dates depend on the return type and filing frequency. Confirm the current deadline with a CA or the GST portal.'
  }

  return 'This is general guidance for your tax question. Share relevant business context if the answer depends on your facts.'
}

export class FakeChatService implements ChatService {
  readonly requests: ChatRequest[] = []
  private readonly configured: boolean
  private readonly response: FakeChatServiceOptions['response']
  private readonly error: FakeChatServiceOptions['error']

  constructor(options: FakeChatServiceOptions = {}) {
    this.configured = options.configured ?? true
    this.response = options.response
    this.error = options.error
  }

  isConfigured(): boolean {
    return this.configured
  }

  async sendMessage(request: ChatRequest): Promise<string> {
    this.requests.push({
      messages: request.messages.map((message) => ({ ...message })),
    })

    if (!this.configured) {
      throw new ChatServiceError('missing-configuration', 'Missing browser configuration.')
    }

    if (this.error) {
      throw new ChatServiceError(this.error, 'Deterministic fake service failure.')
    }

    const response = typeof this.response === 'function' ? await this.response(request) : this.response ?? defaultResponse(request)
    if (!response.trim()) {
      throw new ChatServiceError('empty-response', 'The fake service returned no answer.')
    }

    return response.trim()
  }
}
