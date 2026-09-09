import { ChatShell } from './components/ChatShell'
import { FakeChatService } from './services/fake-chat-service'
import { GeminiChatService } from './services/gemini-chat-service'

const chatService = import.meta.env.MODE === 'test' ? new FakeChatService() : new GeminiChatService()

function App() {
  return <ChatShell responder={chatService.sendMessage.bind(chatService)} />
}

export default App
