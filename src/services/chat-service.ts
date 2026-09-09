import type { ChatRequest } from '../models/chat'

export interface ChatService {
  isConfigured(): boolean
  sendMessage(request: ChatRequest): Promise<string>
}

export type ChatServiceErrorKind =
  | 'missing-configuration'
  | 'request-failed'
  | 'empty-response'

export class ChatServiceError extends Error {
  readonly kind: ChatServiceErrorKind

  constructor(kind: ChatServiceErrorKind, message: string) {
    super(message)
    this.name = 'ChatServiceError'
    this.kind = kind
  }
}
