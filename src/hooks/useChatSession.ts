import { useCallback, useRef, useState } from 'react'
import type {
  ChatError,
  ChatErrorKind,
  ChatMessage,
  ChatRequest,
  ChatSessionState,
} from '../models/chat'

export type MessageSender = (request: ChatRequest) => Promise<string>

export interface ChatSessionController extends ChatSessionState {
  input: string
  setInput: (value: string) => void
  sendMessage: (value?: string) => Promise<boolean>
  newChat: () => void
}

let messageSequence = 0

function createMessageId(role: ChatMessage['role']): string {
  messageSequence += 1
  return `${role}-${messageSequence}`
}

function createSafeError(kind: ChatErrorKind): ChatError {
  switch (kind) {
    case 'missing-configuration':
      return {
        kind,
        message: 'CA Buddy is not configured for this deployment yet.',
      }
    case 'empty-response':
      return {
        kind,
        message: "I didn't receive a usable answer. Please try again.",
      }
    default:
      return {
        kind: 'request-failed',
        message: "I couldn't retrieve an answer. Please try again or start a new chat.",
      }
  }
}

function getErrorKind(error: unknown): ChatErrorKind {
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error.kind === 'missing-configuration' ||
      error.kind === 'request-failed' ||
      error.kind === 'empty-response')
  ) {
    return error.kind
  }

  return 'request-failed'
}

export function useChatSession(send: MessageSender): ChatSessionController {
  const [state, setState] = useState<ChatSessionState>({
    messages: [],
    phase: 'idle',
    error: null,
    generation: 0,
  })
  const [input, setInput] = useState('')
  const generationRef = useRef(0)
  const loadingRef = useRef(false)

  const sendMessage = useCallback(
    async (value?: string): Promise<boolean> => {
      const question = (value ?? input).trim()
      if (!question || loadingRef.current) {
        return false
      }

      const generation = generationRef.current
      const userMessage: ChatMessage = {
        id: createMessageId('user'),
        role: 'user',
        content: question,
      }
      const requestMessages = [...state.messages, userMessage]

      loadingRef.current = true
      setInput('')
      setState((previous) => ({
        ...previous,
        messages: [...previous.messages, userMessage],
        phase: 'loading',
        error: null,
      }))

      try {
        const response = await send({ messages: requestMessages })
        if (generationRef.current !== generation) {
          return false
        }

        const content = response.trim()
        if (!content) {
          throw { kind: 'empty-response' satisfies ChatErrorKind }
        }

        const assistantMessage: ChatMessage = {
          id: createMessageId('assistant'),
          role: 'assistant',
          content,
        }
        setState((previous) => ({
          ...previous,
          messages: [...previous.messages, assistantMessage],
          phase: 'ready',
          error: null,
        }))
        return true
      } catch (error) {
        if (generationRef.current !== generation) {
          return false
        }

        const safeError = createSafeError(getErrorKind(error))
        setState((previous) => ({
          ...previous,
          phase: 'error',
          error: safeError,
        }))
        return false
      } finally {
        if (generationRef.current === generation) {
          loadingRef.current = false
        }
      }
    },
    [input, send, state.messages],
  )

  const newChat = useCallback(() => {
    generationRef.current += 1
    loadingRef.current = false
    setInput('')
    setState({
      messages: [],
      phase: 'idle',
      error: null,
      generation: generationRef.current,
    })
  }, [])

  return {
    ...state,
    input,
    setInput,
    sendMessage,
    newChat,
  }
}
