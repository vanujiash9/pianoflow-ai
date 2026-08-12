import { Bot, Send, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { api } from '../lib/api'

const AssistantAvatar = Bot

type Message = { role: 'user' | 'assistant'; content: string; tools?: string[] }
type ChatResponse = { conversation_id: string; answer: string; tool_calls: string[]; model: string; mode: string }

const suggestions = [
  'Anh Minh từng mua đàn gì?',
  'Khách nào sắp hết bảo hành trong 30 ngày?',
  'Shop đang còn đàn Kawai nào?',
  'Có việc gì cần chú ý trong 14 ngày tới?',
]

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Chào bạn. Mình có thể tra cứu khách, đàn, bảo hành, bảo trì và khách cần follow-up từ dữ liệu PianoFlow.' },
  ])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const send = async (text = input) => {
    if (!text.trim() || loading) return
    const value = text.trim()
    setMessages((current) => [...current, { role: 'user', content: value }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const result = await api<ChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: value, conversation_id: conversationId }),
      })
      setConversationId(result.conversation_id)
      setMessages((current) => [...current, { role: 'assistant', content: result.answer, tools: result.tool_calls }])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="assistant-page">
      <PageHeader title="Trợ lý AI" subtitle="Hỏi dữ liệu vận hành bằng tiếng Việt. AI không tự bịa thông tin khách hoặc đàn." />
      <div className="assistant-layout">
        <section className="panel chat-panel">
          <div className="chat-header">
            <div>
              <Sparkles size={18} />
              <div>
                <strong>PianoFlow AI</strong>
                <span>Tool calling + memory</span>
              </div>
            </div>
            <span className="soft-pill">Nội bộ</span>          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role}`}>
                <div className="chat-avatar">{message.role === 'assistant' ? <AssistantAvatar size={17} /> : <User size={17} />}</div>
                <div className="chat-bubble">
                  <p>{message.content}</p>
                  {message.tools && message.tools.length > 0 && <div className="tool-trace">Tools: {message.tools.join(' → ')}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-avatar">
                  <Bot size={17} />
                </div>
                <div className="chat-bubble typing">Đang tra cứu dữ liệu...</div>
              </div>
            )}
          </div>
          {error && <div className="error-banner compact">{error}</div>}
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: Khách nào cần gọi lại tuần này?"
            />
            <button disabled={loading}>
              <Send size={18} />
            </button>
          </form>
        </section>
        <aside className="panel assistant-help">
          <h3>Câu hỏi gợi ý</h3>
          <p>Những câu này buộc Agent phải chọn đúng tool và đọc dữ liệu thật.</p>
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => void send(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <div className="ai-note">
            <strong>V1 là read-only</strong>
            <span>AI chỉ tra cứu. Các thao tác ghi/xóa dữ liệu vẫn qua màn hình quản lý để tránh thao tác nhầm.</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
