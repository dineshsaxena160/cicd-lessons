import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatShell } from '../../src/components/ChatShell'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe('ChatShell', () => {
  it('exposes the empty chat controls and visible disclaimer', () => {
    render(<ChatShell responder={async () => 'A useful answer'} />)

    expect(screen.getByRole('banner')).toHaveTextContent('CA Buddy')
    expect(screen.getByRole('textbox', { name: /question/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send question/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument()
    expect(screen.getByText(/general information only/i)).toBeInTheDocument()
  })

  it('shows the question and loading state before rendering the response', async () => {
    const response = deferred<string>()
    render(<ChatShell responder={() => response.promise} />)

    const input = screen.getByRole('textbox', { name: /question/i })
    fireEvent.change(input, { target: { value: 'When is my GST return due?' } })
    fireEvent.click(screen.getByRole('button', { name: /send question/i }))

    expect(screen.getByText('When is my GST return due?')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/thinking/i)
    expect(screen.getByRole('button', { name: /send question/i })).toBeDisabled()

    response.resolve('GST return deadlines depend on your filing cycle.')

    await waitFor(() => {
      expect(screen.getByText('GST return deadlines depend on your filing cycle.')).toBeInTheDocument()
    })
  })

  it('clears the visible conversation when New chat is selected', async () => {
    render(<ChatShell responder={async () => 'A response to clear'} />)

    fireEvent.change(screen.getByRole('textbox', { name: /question/i }), {
      target: { value: 'Do I need a tax audit?' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send question/i }))

    await waitFor(() => expect(screen.getByText('A response to clear')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /new chat/i }))

    expect(screen.queryByText('Do I need a tax audit?')).not.toBeInTheDocument()
    expect(screen.queryByText('A response to clear')).not.toBeInTheDocument()
    expect(screen.getByText(/ask a question about GST/i)).toBeInTheDocument()
    expect(screen.getByText(/general information only/i)).toBeInTheDocument()
  })

  it('supports keyboard submission and exposes a polite live status region', async () => {
    render(<ChatShell responder={async () => 'Keyboard answer'} />)

    const input = screen.getByRole('textbox', { name: /question/i })
    expect(screen.getByRole('region', { name: /conversation/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')

    fireEvent.change(input, { target: { value: 'What is TDS?' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => expect(screen.getByText('Keyboard answer')).toBeInTheDocument())
  })
})
