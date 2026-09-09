import type { MessageSender } from '../hooks/useChatSession'
import { useChatSession } from '../hooks/useChatSession'
import { Disclaimer } from './Disclaimer'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'
import { StatusMessage } from './StatusMessage'

interface ChatShellProps {
  responder: MessageSender
}

export function ChatShell({ responder }: ChatShellProps) {
  const session = useChatSession(responder)

  return (
    <div className="app-frame">
      <header className="site-header" role="banner">
        <div className="brand-lockup">
          <span className="brand-lockup__eyebrow">Everyday tax guidance</span>
          <h1>CA Buddy</h1>
        </div>
        <div className="header-note">
          <span className="header-note__line" aria-hidden="true" />
          <span>For small-business owners</span>
        </div>
      </header>

      <main className="chat-layout" aria-label="CA Buddy chat">
        <div className="chat-intro">
          <div>
            <p className="section-kicker">Your practical second opinion</p>
            <h2>What do you need to untangle?</h2>
          </div>
          <p className="chat-intro__hint">Clear answers, useful context, and a nudge to your CA when it matters.</p>
        </div>
        <MessageList messages={session.messages} />
        <StatusMessage phase={session.phase} error={session.error} />
        <MessageComposer
          value={session.input}
          isLoading={session.phase === 'loading'}
          onChange={session.setInput}
          onSubmit={() => void session.sendMessage()}
          onNewChat={session.newChat}
        />
        <Disclaimer />
      </main>
    </div>
  )
}
