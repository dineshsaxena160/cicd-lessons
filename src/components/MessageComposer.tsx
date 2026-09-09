interface MessageComposerProps {
  value: string
  isLoading: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onNewChat: () => void
}

export function MessageComposer({
  value,
  isLoading,
  onChange,
  onSubmit,
  onNewChat,
}: MessageComposerProps) {
  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) {
          onSubmit()
        }
      }}
    >
      <label className="sr-only" htmlFor="question">
        Your tax question
      </label>
      <textarea
        id="question"
        name="question"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (canSubmit) {
              onSubmit()
            }
          }
        }}
        placeholder="Ask CA Buddy anything about everyday tax…"
        rows={2}
        disabled={isLoading}
      />
      <div className="composer__actions">
        <button className="button button--quiet" type="button" onClick={onNewChat}>
          <span aria-hidden="true">↺</span>
          New chat
        </button>
        <button className="button button--send" type="submit" disabled={!canSubmit} aria-label="Send question">
          Send question
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  )
}
