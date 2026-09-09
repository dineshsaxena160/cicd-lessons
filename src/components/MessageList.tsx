import type { ChatMessage } from '../models/chat'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <section className="conversation" aria-label="Conversation" role="region">
      {messages.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__mark" aria-hidden="true">
            ?
          </span>
          <p>Ask a question about GST, TDS, ITR deadlines, or audit basics.</p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map((message) => (
            <article className={`message message--${message.role}`} key={message.id}>
              <span className="message__label">{message.role === 'user' ? 'You' : 'CA Buddy'}</span>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
