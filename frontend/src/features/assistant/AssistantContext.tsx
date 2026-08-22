import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type ReactElement } from 'react'
import { api, ApiError } from '../../lib/api'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ConversationHistory = {
  conversation_id: string
  title: string
  messages: Message[]
}

type ChatResponse = {
  conversation_id: string
  answer: string
  tool_calls: string[]
  model: string
  mode: string
}

type AssistantContextValue = {
  messages: Message[]
  conversationId: string | null
  isResponding: boolean
  draft: string
  error: string
  setDraft: (value: string) => void
  sendMessage: (message: string) => Promise<void>
  resetConversation: () => void
}

const ASSISTANT_CONVERSATION_KEY = 'pianoflow-ai-assistant-conversation-id'
const initialMessage: Message = { role: 'assistant', content: 'Chào bạn.' }

const AssistantContext = createContext<AssistantContextValue | null>(null)

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
    if (error instanceof ApiError && error.status === 404) {
      storeConversationId(null)
      return null
    }
    throw error
  }
}

export function AssistantProvider({ children }: { children: ReactNode }): ReactElement {
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isResponding, setIsResponding] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const restoreConversation = async () => {
      const storedConversationId = readStoredConversationId()
      if (!storedConversationId) {
        setHasHydrated(true)
        return
      }

      try {
        const history = await loadConversationMessages(storedConversationId)
        if (!history) {
          setHasHydrated(true)
          return
        }
        setConversationId(storedConversationId)
        setMessages(history)
      } catch {
        storeConversationId(null)
        setConversationId(null)
        setMessages([initialMessage])
      } finally {
        setHasHydrated(true)
      }
    }

    void restoreConversation()
  }, [])

  const sendMessage = async (message: string) => {
    const value = message.trim()
    if (!value || isResponding) return

    setDraft('')
    setMessages((current) => [...current, { role: 'user', content: value }])
    setIsResponding(true)
    setError('')

    try {
      const result = await api<ChatResponse>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: value, conversation_id: conversationId }),
      })
      setConversationId(result.conversation_id)
      storeConversationId(result.conversation_id)
      setMessages((current) => [...current, { role: 'assistant', content: result.answer }])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsResponding(false)
    }
  }

  const resetConversation = () => {
    storeConversationId(null)
    setMessages([initialMessage])
    setConversationId(null)
    setDraft('')
    setError('')
  }

  const value = useMemo(
    () => ({
      messages: hasHydrated ? messages : [initialMessage],
      conversationId,
      isResponding,
      draft,
      error,
      setDraft,
      sendMessage,
      resetConversation,
    }),
    [conversationId, draft, error, hasHydrated, isResponding, messages],
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return context
}
