import { Bot, RotateCcw, Send, ShieldCheck, User } from 'lucide-react'
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { api } from '../../lib/api'
import './assistant.css'

const ASSISTANT_CONVERSATION_KEY = 'pianoflow-ai-assistant-conversation-id'


type ConversationHistory = {
  conversation_id: string
  title: string
  messages: Message[]
}

function readStoredConversationId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ASSISTANT_CONVERSATION_KEY)
}

function storeConversationId(conversationId: string | null): void {
  if (typeof window === 'undefined') return
  if (conversationId) {
    window.localStorage.setItem(ASSISTANT_CONVERSATION_KEY, conversationId)
    return
  }
  window.localStorage.removeItem(ASSISTANT_CONVERSATION_KEY)
}

async function loadConversationMessages(conversationId: string): Promise<Message[] | null> {
  try {
    const result = await api<ConversationHistory>(`/ai/conversations/${conversationId}`)
    return result.messages.length > 0 ? result.messages : [initialMessage]
  } catch (error) {
    if (error instanceof Error && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
      storeConversationId(null)
      return null
    }
    throw error
  }
}


type ChatResponse = {
  conversation_id: string
  answer: string
  tool_calls: string[]
  model: string
  mode: string
}

const initialMessage: Message = {
  role: 'assistant',
  content: 'Chào bạn.',
}

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    initialMessage,
  ])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const restoreConversation = async () => {
      const storedConversationId = readStoredConversationId()
      if (!storedConversationId) return

      try {
        const history = await loadConversationMessages(storedConversationId)
        if (!history) return

        setConversationId(storedConversationId)
        setMessages(history)
      } catch {
        storeConversationId(null)
        setConversationId(null)
        setMessages([initialMessage])
      }
    }

    void restoreConversation()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, loading])

  const send = async () => {
    const value = input.trim()

    if (!value || loading) return

    setMessages((current) => [
      ...current,
      {
        role: 'user',
        content: value,
      },
    ])

    setInput('')
    setLoading(true)
    setError('')

    try {
      const result = await api<ChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: value,
          conversation_id: conversationId,
        }),
      })

      setConversationId(result.conversation_id)
      storeConversationId(result.conversation_id)

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.answer,
        },
      ])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const resetConversation = () => {
    storeConversationId(null)
    setMessages([initialMessage])
    setConversationId(null)
    setInput('')
    setError('')
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send()
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="assistant-page">
      <PageHeader
        title="Trợ lý AI"
        subtitle=""
        actions={
          <button
            type="button"
            className="secondary-button"
            onClick={resetConversation}
            disabled={loading}
          >
            <RotateCcw size={15} />
            Cuộc trò chuyện mới
          </button>
        }
      />

      <section className="panel assistant-chat">
        <header className="assistant-chat-header">
          <div className="assistant-info">
            <div className="assistant-logo">
              <Bot size={19} />
            </div>

            <div>
              <strong>AI</strong>
            </div>
          </div>

        </header>

        <div className="assistant-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`assistant-message ${message.role}`}
            >
              <div className="assistant-avatar">
                {message.role === 'assistant' ? (
                  <Bot size={17} />
                ) : (
                  <User size={17} />
                )}
              </div>

              <div className="assistant-bubble">
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="assistant-message assistant">
              <div className="assistant-avatar">
                <Bot size={17} />
              </div>

              <div className="assistant-bubble assistant-loading">
                <span />
                <span />
                <span />
                <small>Đang tra cứu...</small>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="error-banner assistant-error">
            {error}
          </div>
        )}

        <form
          className="assistant-input-area"
          onSubmit={handleSubmit}
        >
          <div className="assistant-input">
            <textarea
              rows={1}
              value={input}
              disabled={loading}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Gửi"
            >
              <Send size={18} />
            </button>
          </div>

        </form>
      </section>
    </div>
  )
}