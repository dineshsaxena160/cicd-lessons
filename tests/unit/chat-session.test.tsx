import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChatRequest } from '../../src/models/chat'
import { useChatSession } from '../../src/hooks/useChatSession'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

describe('useChatSession', () => {
  it('rejects empty input and trims a valid question before sending', async () => {
    const responder = vi.fn(async ({ messages }: ChatRequest) => {
      return `Answer: ${messages.at(-1)?.content}`
    })
    const { result } = renderHook(() => useChatSession(responder))

    await act(async () => {
      await result.current.sendMessage('   ')
    })

    expect(responder).not.toHaveBeenCalled()
    expect(result.current.messages).toEqual([])

    await act(async () => {
      await result.current.sendMessage('  When is my GST return due?  ')
    })

    expect(responder).toHaveBeenCalledWith({
      messages: [
        expect.objectContaining({
          role: 'user',
          content: 'When is my GST return due?',
        }),
      ],
    })
    expect(result.current.messages.at(-1)?.content).toContain('When is my GST return due?')
    expect(result.current.phase).toBe('ready')
  })

  it('shows loading and prevents duplicate requests while waiting', async () => {
    const response = deferred<string>()
    const responder = vi.fn(() => response.promise)
    const { result } = renderHook(() => useChatSession(responder))

    await act(async () => {
      result.current.setInput('Do I need a tax audit?')
    })
    act(() => {
      void result.current.sendMessage()
      void result.current.sendMessage()
    })

    expect(result.current.phase).toBe('loading')
    expect(responder).toHaveBeenCalledTimes(1)
    expect(result.current.messages).toHaveLength(1)

    await act(async () => {
      response.resolve('It depends on your business facts. Please consult a CA.')
      await response.promise
    })

    await waitFor(() => expect(result.current.phase).toBe('ready'))
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages.at(-1)?.role).toBe('assistant')
  })

  it('forwards the active ordered conversation and drops a late response after New chat', async () => {
    const firstResponse = deferred<string>()
    const requests: ChatRequest[] = []
    const responder = vi.fn((request: ChatRequest) => {
      requests.push(request)
      return requests.length === 1 ? firstResponse.promise : Promise.resolve('Fresh answer')
    })
    const { result } = renderHook(() => useChatSession(responder))

    act(() => {
      void result.current.sendMessage('What is TDS?')
    })

    await act(async () => {
      result.current.newChat()
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.phase).toBe('idle')

    await act(async () => {
      firstResponse.resolve('Old answer should not return')
      await firstResponse.promise
    })

    await waitFor(() => expect(result.current.messages).toEqual([]))

    await act(async () => {
      await result.current.sendMessage('What is GST?')
    })

    expect(requests[1].messages).toHaveLength(1)
    expect(requests[1].messages[0].content).toBe('What is GST?')
    expect(result.current.messages.map((message) => message.content)).toEqual(['What is GST?', 'Fresh answer'])
  })

  it('includes earlier user and assistant messages in a follow-up request', async () => {
    const requests: ChatRequest[] = []
    const responder = vi.fn(async (request: ChatRequest) => {
      requests.push(request)
      return requests.length === 1 ? 'The first answer' : 'The follow-up answer'
    })
    const { result } = renderHook(() => useChatSession(responder))

    await act(async () => {
      await result.current.sendMessage('When is my GST return due?')
    })
    await act(async () => {
      await result.current.sendMessage('What if I file quarterly?')
    })

    expect(requests[1].messages.map((message) => message.content)).toEqual([
      'When is my GST return due?',
      'The first answer',
      'What if I file quarterly?',
    ])
  })
})
