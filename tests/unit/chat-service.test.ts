import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { describe, expect, it, vi } from 'vitest'
import {
  ChatServiceError,
  GeminiChatService,
  MAX_OUTPUT_TOKENS,
  MODEL_NAME,
} from '../../src/services/gemini-chat-service'
import { FakeChatService } from '../../src/services/fake-chat-service'
import type { ChatRequest } from '../../src/models/chat'

const request: ChatRequest = {
  messages: [
    { id: 'user-1', role: 'user', content: 'When is my GST return due?' },
    { id: 'assistant-1', role: 'assistant', content: 'It depends on your filing cycle.' },
    { id: 'user-2', role: 'user', content: 'What about my next filing?' },
  ],
}

describe('FakeChatService', () => {
  it('records ordered requests and returns deterministic text', async () => {
    const service = new FakeChatService({ response: 'A deterministic answer.' })

    await expect(service.sendMessage(request)).resolves.toBe('A deterministic answer.')
    expect(service.requests).toEqual([request])
    expect(service.isConfigured()).toBe(true)
  })

  it('reports missing configuration, request failure, and empty response safely', async () => {
    await expect(new FakeChatService({ configured: false }).sendMessage(request)).rejects.toMatchObject({
      kind: 'missing-configuration',
    })
    await expect(new FakeChatService({ error: 'request-failed' }).sendMessage(request)).rejects.toMatchObject({
      kind: 'request-failed',
    })
    await expect(new FakeChatService({ response: '' }).sendMessage(request)).rejects.toMatchObject({
      kind: 'empty-response',
    })
  })
})

describe('GeminiChatService', () => {
  it('uses the required model settings and maps the ordered prompt', async () => {
    const model = {
      invoke: vi.fn().mockResolvedValue(new AIMessage('  A model answer.  ')),
    }
    const service = new GeminiChatService({ apiKey: 'browser-key', model })

    await expect(service.sendMessage(request)).resolves.toBe('A model answer.')
    expect(service.isConfigured()).toBe(true)
    expect(MODEL_NAME).toBe('gemma-4-26b-a4b-it')
    expect(MAX_OUTPUT_TOKENS).toBe(1024)

    const [messages] = model.invoke.mock.calls[0] as [Array<SystemMessage | HumanMessage | AIMessage>]
    expect(messages[0]).toBeInstanceOf(SystemMessage)
    expect(messages.slice(1).map((message) => message.getType())).toEqual(['human', 'ai', 'human'])
  })

  it('classifies missing keys, provider failures, and empty responses', async () => {
    await expect(new GeminiChatService({ apiKey: '' }).sendMessage(request)).rejects.toMatchObject({
      kind: 'missing-configuration',
    })

    const failingModel = { invoke: vi.fn().mockRejectedValue(new Error('provider details')) }
    await expect(new GeminiChatService({ apiKey: 'browser-key', model: failingModel }).sendMessage(request)).rejects.toMatchObject({
      kind: 'request-failed',
    })

    const emptyModel = { invoke: vi.fn().mockResolvedValue({ content: [] }) }
    await expect(new GeminiChatService({ apiKey: 'browser-key', model: emptyModel }).sendMessage(request)).rejects.toMatchObject({
      kind: 'empty-response',
    })

    expect(new ChatServiceError('request-failed', 'hidden provider details')).toBeInstanceOf(Error)
  })
})
