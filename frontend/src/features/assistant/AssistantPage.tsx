import { Bot, RotateCcw, Send, User } from 'lucide-react'
import { FormEvent, KeyboardEvent, useEffect, useRef } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAssistant } from './AssistantContext'
import './assistant.css'

export function AssistantPage() {
  const {
    messages,
    conversationId,
    isResponding,
    draft,
    error,
    setDraft,
    sendMessage,
    resetConversation,
  } = useAssistant()

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isResponding])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage(draft)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey && !isResponding) {
      event.preventDefault()
      void sendMessage(draft)
    }
  }

  return (
    <div className="assistant-page">
      <PageHeader
        title="Trợ lý AI"
        subtitle={conversationId ? '' : ''}
        actions={
          <button
            type="button"
            className="secondary-button"
            onClick={resetConversation}
            disabled={isResponding}
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

          {isResponding && (
            <div className="assistant-message assistant">
              <div className="assistant-avatar">
                <Bot size={17} />
              </div>

              <div className="assistant-bubble assistant-loading">
                <span />
                <span />
                <span />
                <small>Đang trả lời...</small>
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
            />

            <button
              type="submit"
              disabled={!draft.trim() || isResponding}
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