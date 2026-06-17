import { useEffect, useMemo, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import {
  createChatSession,
  getChatSessionMessages,
  getChatSessions,
  sendChatMessage,
} from './aiService'

export default function AIChat({ documentId, documentTitle }) {
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messageListRef = useRef(null)

  const currentDocumentId = useMemo(() => {
    if (documentId === undefined || documentId === null || documentId === '') return null
    return Number(documentId)
  }, [documentId])

  useEffect(() => {
    let active = true

    Promise.resolve()
      .then(() => {
        setLoadingSessions(true)
        setError('')
        return getChatSessions()
      })
      .then((items = []) => {
        if (!active) return
        const documentSession = currentDocumentId
          ? items.find((session) => Number(session.documentId) === currentDocumentId)
          : items[0]
        setActiveSession(documentSession || null)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingSessions(false)
      })

    return () => {
      active = false
    }
  }, [currentDocumentId])

  useEffect(() => {
    let active = true

    if (!activeSession?.id) {
      Promise.resolve().then(() => {
        if (active) setMessages([])
      })
      return () => {
        active = false
      }
    }

    Promise.resolve()
      .then(() => {
        setLoadingMessages(true)
        setError('')
        return getChatSessionMessages(activeSession.id)
      })
      .then((items = []) => {
        if (active) setMessages(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingMessages(false)
      })

    return () => {
      active = false
    }
  }, [activeSession?.id])

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setDraft('')
    setSending(true)
    setError('')
    const userMessage = {
      id: `local-${Date.now()}`,
      senderType: 'USER',
      messageContent: content,
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, userMessage])

    try {
      let session = activeSession
      if (!session?.id) {
        session = await createChatSession({
          documentId: currentDocumentId,
          sessionTitle: documentTitle ? `Chat: ${documentTitle}` : 'New AI chat',
        })
        setActiveSession(session)
      }

      const aiReply = await sendChatMessage(session.id, content)
      setMessages((current) => [...current, aiReply])
      setActiveSession({ ...session, updatedAt: aiReply?.createdAt ?? new Date().toISOString() })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  const applyPrompt = (content) => {
    setDraft(content)
  }

  return (
    <aside className="ai-tutor-panel">
      <header className="ai-tutor-header">
        <strong>AI Tutor</strong>
        <span>This Session</span>
      </header>

      <div className="ai-tutor-tools">
        <article>
          <span><StudyHubIcon name="card" size={18} /></span>
          <div><strong>Flashcards <small>Popular</small></strong><p>Study with active recall</p></div>
        </article>
        <article>
          <span><StudyHubIcon name="help" size={18} /></span>
          <div><strong>Quizzes <small>Popular</small></strong><p>Test your knowledge</p></div>
        </article>
      </div>

      <div className="ai-tutor-orb" aria-hidden="true" />

      <section className="ai-tutor-question-card">
        <strong>Have a Question about your import?</strong>
        <p>You can ask questions about your imported content, and your answers will appear here</p>
        <div>
          <button onClick={() => applyPrompt('Write a paragraph summary for this document.')} type="button">Write a paragraph...</button>
          <button onClick={() => applyPrompt('Explain the most important concept in this document.')} type="button">Explain concept...</button>
          <button onClick={() => applyPrompt('Compare the key ideas in this document.')} type="button">Compare with...</button>
        </div>
      </section>

      {error && <p className="api-status api-status--error">{error}</p>}

      <div className="ai-tutor-messages" ref={messageListRef}>
        {loadingSessions || loadingMessages ? (
          <p className="ai-chat-muted">Loading chat...</p>
        ) : messages.length ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <p className="ai-chat-muted">{activeSession ? 'No messages yet.' : 'Ask AI about this document.'}</p>
        )}
        {sending && <div className="ai-chat-typing">AI is thinking...</div>}
      </div>

      <form className="ai-tutor-composer" onSubmit={handleSubmit}>
        <StudyHubIcon name="sparkle" size={16} />
        <input
          disabled={sending || !currentDocumentId}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={currentDocumentId ? 'Ask AI assistant...' : 'Missing documentId'}
          value={draft}
        />
        <button disabled={sending || !draft.trim() || !currentDocumentId} type="submit">
          <StudyHubIcon name="message" size={16} />
        </button>
      </form>
    </aside>
  )
}

function MessageBubble({ message }) {
  const isUser = String(message.senderType).toUpperCase() === 'USER'
  return (
    <article className={isUser ? 'ai-message ai-message--user' : 'ai-message ai-message--ai'}>
      <p>{message.messageContent}</p>
      <small>{formatChatDate(message.createdAt)}</small>
    </article>
  )
}

function formatChatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
