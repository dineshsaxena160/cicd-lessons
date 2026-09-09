import type { ChatError, ChatPhase } from '../models/chat'

interface StatusMessageProps {
  phase: ChatPhase
  error: ChatError | null
}

export function StatusMessage({ phase, error }: StatusMessageProps) {
  const message = phase === 'loading' ? 'Thinking through that…' : error?.message ?? 'Ready when you are.'

  return (
    <div className={`status status--${phase}`} role="status" aria-live="polite" aria-busy={phase === 'loading'}>
      <span className="status__dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
