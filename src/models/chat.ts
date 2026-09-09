export type ChatRole = 'user' | 'assistant'

export type ChatPhase = 'idle' | 'loading' | 'ready' | 'error'

export type ChatErrorKind =
  | 'missing-configuration'
  | 'request-failed'
  | 'empty-response'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface ChatRequest {
  messages: readonly ChatMessage[]
}

export interface ChatError {
  kind: ChatErrorKind
  message: string
}

export interface ChatSessionState {
  messages: ChatMessage[]
  phase: ChatPhase
  error: ChatError | null
  generation: number
}
