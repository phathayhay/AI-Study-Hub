import { useEffect, useState, useRef } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { studyTabs } from '../../data/studyHubData'
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  getDocumentFlashcardSets,
  getDocumentQuizzes,
  getFlashcardSet,
  getQuiz,
  createChatSession,
  getUserChatSessions,
  getChatSessionMessages,
  sendChatMessage,
} from '../../features/ai/aiService'

export default function StudyDocumentApi({ activeTab, file, onBack, onTabChange }) {
  const documentId = file?.documentId ?? file?.id
  const [summary, setSummary] = useState(null)
  const [flashcardSet, setFlashcardSet] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rightPanelWidth, setRightPanelWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)

  // sliding active tab state
  const tabRefs = useRef({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab]
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth
        })
      }
    }
    
    updateIndicator()
    const timer = setTimeout(updateIndicator, 100)
    window.addEventListener('resize', updateIndicator)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeTab, loading])

  // ── AI CHATBOT STATES & HANDLERS ─────────────────────────────
  const [chatSessions, setChatSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false)
  const [chatSendLoading, setChatSendLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatScope, setChatScope] = useState('document') // 'document' or 'general'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load sessions and history on mount or when context changes
  useEffect(() => {
    let active = true
    setChatMessagesLoading(true)
    setChatMessages([])
    setCurrentSessionId(null)

    getUserChatSessions()
      .then((res) => {
        if (!active) return
        const list = res?.data || res || []
        const isArr = Array.isArray(list)
        setChatSessions(isArr ? list : [])
        
        let matchingSession = null
        if (isArr) {
          if (chatScope === 'document' && documentId) {
            matchingSession = list.find(s => s.documentId === Number(documentId))
          } else if (chatScope === 'general') {
            matchingSession = list.find(s => s.documentId === null || s.documentId === undefined)
          }
        }

        if (matchingSession) {
          setCurrentSessionId(matchingSession.id)
          return getChatSessionMessages(matchingSession.id)
        }
      })
      .then((res) => {
        if (!active || !res) return
        const msgList = res?.data || res || []
        setChatMessages(Array.isArray(msgList) ? msgList : [])
      })
      .catch((err) => {
        console.error('Failed to load chat:', err)
      })
      .finally(() => {
        if (active) setChatMessagesLoading(false)
      })

    return () => { active = false }
  }, [documentId, chatScope])

  const handleSendChatMessage = async (overrideContent = null) => {
    const textToSend = (overrideContent || chatInput).trim()
    if (!textToSend || chatSendLoading) return

    setChatSendLoading(true)
    if (!overrideContent) setChatInput('')

    // Add optimistic user message
    const userMsg = {
      id: Date.now(),
      senderType: 'USER',
      messageContent: textToSend,
      createdAt: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, userMsg])

    try {
      let sessionId = currentSessionId
      if (!sessionId) {
        const docIdToLink = chatScope === 'document' ? documentId : null
        const sessionTitle = chatScope === 'document' 
          ? `Trò chuyện về: ${file?.name || file?.attachmentName || 'Tài liệu'}`
          : 'Cuộc trò chuyện mới'
        
        const createRes = await createChatSession(docIdToLink, sessionTitle)
        const newSession = createRes?.data || createRes
        if (newSession && newSession.id) {
          sessionId = newSession.id
          setCurrentSessionId(sessionId)
          setChatSessions(prev => [newSession, ...prev])
        } else {
          throw new Error('Không thể tạo phiên trò chuyện')
        }
      }

      const sendRes = await sendChatMessage(sessionId, textToSend)
      const aiReply = sendRes?.data || sendRes
      if (aiReply) {
        setChatMessages(prev => [...prev, aiReply])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      window.showToast?.(err.message || 'Lỗi khi gửi tin nhắn', 'error')
    } finally {
      setChatSendLoading(false)
    }
  }

  const handleSuggestionClick = (type) => {
    let prompt = ''
    if (type === 'summary') {
      prompt = 'Tóm tắt nội dung chính của tài liệu này một cách ngắn gọn.'
    } else if (type === 'concept') {
      prompt = 'Giải thích các khái niệm quan trọng nhất xuất hiện trong tài liệu.'
    } else if (type === 'compare') {
      prompt = 'So sánh các luận điểm chính trong tài liệu này và rút ra kết luận.'
    }
    handleSendChatMessage(prompt)
  }

  const parseInline = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g)
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-slate-900 dark:text-white" style={{ fontWeight: 600 }}>{part}</strong>
      }
      return part
    })
  }

  const renderMarkdown = (text) => {
    if (!text) return ''
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      const content = line.trim()
      if (!content) return <div key={idx} style={{ height: '8px' }} />

      if (content.startsWith('### ')) {
        return <h4 key={idx} className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0 4px' }}>{parseInline(content.substring(4))}</h4>
      }
      if (content.startsWith('## ')) {
        return <h3 key={idx} className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 6px' }}>{parseInline(content.substring(3))}</h3>
      }
      if (content.startsWith('# ')) {
        return <h2 key={idx} className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 8px' }}>{parseInline(content.substring(2))}</h2>
      }

      if (content.startsWith('* ') || content.startsWith('- ')) {
        return (
          <li key={idx} className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ marginLeft: '16px', listStyleType: 'disc', margin: '4px 0', fontSize: '14px', lineHeight: 1.5 }}>
            {parseInline(content.substring(2))}
          </li>
        )
      }

      const numListMatch = content.match(/^(\d+)\.\s(.*)/)
      if (numListMatch) {
        return (
          <li key={idx} className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ marginLeft: '16px', listStyleType: 'decimal', margin: '4px 0', fontSize: '14px', lineHeight: 1.5 }}>
            {parseInline(numListMatch[2])}
          </li>
        )
      }

      return (
        <p key={idx} className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ fontSize: '14px', margin: '4px 0 8px', lineHeight: 1.5 }}>
          {parseInline(content)}
        </p>
      )
    })
  }


  useEffect(() => {
    if (!isResizing) return undefined

    const handleMouseMove = (e) => {
      const newWidth = document.body.clientWidth - e.clientX - 36
      const maxWidth = document.body.clientWidth - 256 - 48 - 400 
      
      if (newWidth >= 340 && newWidth <= Math.min(800, maxWidth)) {
        setRightPanelWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (!documentId) return undefined
    let active = true
    setLoading(true)
    // Load quizzes separately (still used by quiz tab)
    getDocumentQuizzes(documentId)
      .then((quizList) => { if (active) setQuizzes(quizList) })
      .catch(() => {})
    // Auto-load flashcard: use existing set or generate new one
    getDocumentFlashcardSets(documentId)
      .then(async (sets) => {
        if (!active) return
        if (sets && sets.length > 0) {
          const set = await getFlashcardSet(sets[0].id)
          if (active) setFlashcardSet(set)
        } else {
          const generated = await generateFlashcards(documentId)
          if (active && generated) setFlashcardSet(generated)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [documentId])

  const runRequest = async (request) => {
    setLoading(true)
    setError('')
    try {
      return await request()
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleSummary = async () => {
    const result = await runRequest(() => generateSummary(documentId))
    if (result) {
      setSummary(result)
      window.showToast?.('AI Summary generated successfully', 'success')
    }
  }

  const regenerateFlashcards = async () => {
    const result = await runRequest(() => generateFlashcards(documentId))
    if (result) {
      setFlashcardSet(result)
      window.showToast?.('AI Flashcards generated successfully', 'success')
    }
  }

  const handleQuiz = async (difficulty) => {
    const result = await runRequest(() => generateQuiz(documentId, difficulty))
    if (!result) return
    setQuiz(result)
    setQuizzes((current) => [result, ...current.filter((item) => item.id !== result.id)])
    window.showToast?.('AI Quiz generated successfully', 'success')
  }

  const openQuiz = async (quizId) => {
    const result = await runRequest(() => getQuiz(quizId))
    if (result) setQuiz(result)
  }

  return (
    <div className="study-shell bg-slate-50 dark:bg-slate-900 transition-colors duration-300 ease-in-out" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <main className="study-main" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', userSelect: isResizing ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', overflow: 'hidden' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', zIndex: 10, paddingLeft: '4px', paddingRight: '4px' }}>
              <nav className="study-tabs-container">
                {/* Sliding active tab indicator background */}
                <div className="study-tab-indicator" style={indicatorStyle} />
                {studyTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button 
                      key={tab.id} 
                      ref={(el) => { tabRefs.current[tab.id] = el }}
                      onClick={() => onTabChange(tab.id)} 
                      type="button"
                      className={`study-tab-btn ${isActive ? 'is-active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 ease-in-out" style={{ flex: 1, borderRadius: '16px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* CONTENT AREA */}
              <div style={{ flex: 1, padding: activeTab === 'original' ? '0' : '24px', overflowY: activeTab === 'original' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
                {!documentId && <p className="api-status api-status--error">Tài liệu này chưa có documentId từ backend.</p>}
                {error && <p className="api-status api-status--error">{error}</p>}
                
                <div style={{ display: activeTab === 'original' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
                  {/* SINGLE FILE HEADER */}
                  <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300" style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    <button className="border border-indigo-500 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors duration-200" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <StudyHubIcon name="plus" size={16} />
                    </button>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                      <StudyHubIcon name="file" size={14} />
                      {file?.name || 'Untitled document'}
                    </div>
                  </div>
                  <OriginalDocument file={file} />
                </div>
              
              {activeTab === 'summary' && (
                summary ? <SummaryView summary={summary} /> : (
                  <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300" style={{ flex: 1, borderRadius: '16px', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, margin: 0 }}>
                        <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 600 }}>AI</span> Summary
                      </h2>
                      <p className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ marginTop: '16px', fontSize: '15px', fontWeight: 500, textAlign: 'center' }}>
                        Create a clear and easy-to-understand summary of your content
                      </p>
                      <button 
                        onClick={handleSummary}
                        disabled={!documentId || loading}
                        style={{ marginTop: '24px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <StudyHubIcon name="sparkles" size={16} />
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'flashcards' && (
                flashcardSet
                  ? <FlashcardViewer set={flashcardSet} onRegenerate={regenerateFlashcards} loading={loading} />
                  : <div className="text-indigo-600 dark:text-indigo-400" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px' }}>
                      <div className="border-4 border-indigo-100 dark:border-indigo-950/40 border-t-indigo-600 dark:border-t-indigo-400" style={{ width: '48px', height: '48px', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>{loading ? 'Generating flashcards...' : 'Loading flashcards...'}</p>
                    </div>
              )}
              {activeTab === 'quizzes' && (quiz ? <QuizViewer onBack={() => setQuiz(null)} quiz={quiz} /> : <QuizPanel disabled={!documentId || loading} loading={loading} onCreate={handleQuiz} onOpen={openQuiz} quizzes={quizzes} />)}
              </div>
            </div>
          </div>

          {/* DRAGGABLE RESIZER */}
          <div 
            onMouseDown={() => setIsResizing(true)}
            style={{ 
              width: '24px', 
              cursor: 'col-resize', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <div 
              className={`w-1 h-10 rounded-full transition-all duration-200 ${
                isResizing 
                  ? 'bg-indigo-600 dark:bg-indigo-400 opacity-100' 
                  : 'bg-slate-300 dark:bg-slate-600 opacity-60 hover:opacity-100'
              }`}
            />
          </div>

          {/* RIGHT COLUMN (AI TUTOR) */}
          <aside style={{ width: `${rightPanelWidth}px`, flexShrink: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px', flexShrink: 0 }}>
                <h3 className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Tutor</h3>
              </div>
              
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', padding: '24px', overflow: 'hidden' }}>
                
                {/* Scrollable Content */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingRight: '8px', marginRight: '-8px' }}>
                  {chatMessagesLoading ? (
                    <div className="text-indigo-600 dark:text-indigo-400" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px' }}>
                      <div className="border-3 border-indigo-100 dark:border-indigo-950/40 border-t-indigo-600 dark:border-t-indigo-400" style={{ width: '32px', height: '32px', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '13px', margin: 0 }}>Loading chat history...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '16px', marginTop: '32px' }}>
                      <h4 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Have a Question about your import?</h4>
                      <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '14px', marginBottom: '32px', lineHeight: 1.6, maxWidth: '280px' }}>You can ask questions about your imported content, and your answers will appear here</p>
                      
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button onClick={() => handleSuggestionClick('summary')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px', cursor: 'pointer' }}>Write a paragraph...</button>
                        <button onClick={() => handleSuggestionClick('concept')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px', cursor: 'pointer' }}>Explain concept...</button>
                        <button onClick={() => handleSuggestionClick('compare')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px', cursor: 'pointer' }}>Compare with...</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                      {chatMessages.map((msg) => {
                        const isUser = msg.senderType === 'USER'
                        return (
                          <div 
                            key={msg.id} 
                            className={`transition-colors duration-300 ${
                              isUser 
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                            style={{ 
                              alignSelf: isUser ? 'flex-end' : 'flex-start',
                              maxWidth: isUser ? '85%' : '100%',
                              borderRadius: isUser ? '16px 16px 0 16px' : '0',
                              padding: isUser ? '10px 16px' : '4px 0',
                            }}
                          >
                            {isUser ? (
                              <p style={{ fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{msg.messageContent}</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {renderMarkdown(msg.messageContent)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {chatSendLoading && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontStyle: 'italic', padding: '4px 0' }}>
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite alternate' }} />
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.2s' }} />
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'pulse 1s infinite alternate 0.4s' }} />
                          AI is thinking...
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors duration-300" style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChatMessage()
                      }
                    }}
                    placeholder={chatScope === 'document' ? "Ask about this document..." : "Ask AI tutor anything..."} 
                    rows={2}
                    className="bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
                    style={{ 
                      width: '100%', 
                      border: 'none', 
                      padding: '16px 16px 8px', 
                      fontSize: '14px', 
                      outline: 'none', 
                      minWidth: 0,
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', alignItems: 'center' }}>
                      <button 
                        type="button"
                        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
                        style={{ 
                          cursor: 'pointer', 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                        }}
                      >
                        <StudyHubIcon name="image" size={18} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Scope Selector Capsule */}
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          type="button"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200"
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            border: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer', 
                            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                          }}
                          title={chatScope === 'document' ? 'This Session' : 'General Chat'}
                        >
                          <StudyHubIcon name={chatScope === 'document' ? 'file-text' : 'message'} size={18} />
                        </button>
                        
                        {isDropdownOpen && (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-50" style={{ 
                            position: 'absolute', 
                            bottom: '100%', 
                            right: 0, 
                            marginBottom: '8px', 
                            borderRadius: '12px', 
                            width: '140px',
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={() => {
                                setChatScope('document')
                                setIsDropdownOpen(false)
                              }}
                              type="button"
                              className={`w-full py-2.5 px-3.5 text-xs text-left cursor-pointer border-none transition-all duration-150 ${
                                chatScope === 'document'
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              This Session
                            </button>
                            <button
                              onClick={() => {
                                setChatScope('general')
                                setIsDropdownOpen(false)
                              }}
                              type="button"
                              className={`w-full py-2.5 px-3.5 text-xs text-left cursor-pointer border-none transition-all duration-150 ${
                                chatScope === 'general'
                                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              General Chat
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        type="button"
                        className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                        style={{ 
                          border: 'none', 
                          background: 'transparent', 
                          cursor: 'pointer', 
                          padding: 0, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                        }}
                      >
                        <StudyHubIcon name="mic" size={20} />
                      </button>
                      
                      <button 
                        onClick={() => handleSendChatMessage()}
                        disabled={chatSendLoading}
                        className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white transition-all duration-200 shadow-sm"
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          border: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer', 
                          opacity: chatSendLoading ? 0.6 : 1,
                        }}
                      >
                        <StudyHubIcon name="arrow-up" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function OriginalDocument({ file }) {
  const documentName = file?.name || file?.attachmentName || 'Untitled document'
  const fileUrl = file?.fileUrl || ''

  const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
  const isLocal = fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')

  if (!fileUrl) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
        Không có URL file từ backend để xem trước.
      </div>
    )
  }

  // Render PDF directly using browser's built-in PDF viewer
  if (isPdf) {
    return (
      <div className="document-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          title="Document Preview"
          style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none' }}
        />
      </div>
    )
  }

  // Prevent Google Docs Viewer from downloading 'qview' when trying to access localhost
  if (isLocal) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#475569', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m21 16-4-4-4 4" />
            <path d="m14 14-3-3-4 3" />
            <circle cx="9" cy="9" r="2" />
          </svg>
        </div>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Không thể xem trước tệp Word/PowerPoint trên localhost</h4>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', lineHeight: 1.5, margin: 0 }}>
            Google Docs Viewer không thể kết nối tới máy chủ <strong>localhost</strong> trong môi trường phát triển local của bạn để lấy nội dung file.
          </p>
        </div>
        <a
          href={fileUrl}
          download={documentName}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#6366f1',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.15)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Tải tài liệu về máy
        </a>
      </div>
    )
  }

  // Default cloud URL viewer via Google Docs Viewer
  return (
    <div className="document-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
        width="100%"
        height="100%"
        title="Document Preview"
        style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none' }}
      />
    </div>
  )
}

function GeneratePanel({ disabled, label, loading, onGenerate }) {
  return (
    <section className="ai-generate-panel">
      <h2><span>AI</span> {label}</h2>
      <p>Generate content from the uploaded document using the backend AI service.</p>
      <button className="ai-generate-button" disabled={disabled || loading} onClick={onGenerate} type="button">
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <StudyHubIcon name="sparkle" size={16} />
            <span>Generate</span>
          </>
        )}
      </button>
    </section>
  )
}

const FONT_STEPS = [12, 13, 14, 15, 16, 18, 20, 22, 24]

function SummaryView({ summary }) {
  const [fontStep, setFontStep] = useState(4) // default index → 16px
  const fontSize = FONT_STEPS[fontStep]

  const handleDownload = () => {
    const lines = [
      'AI SUMMARY',
      '==========',
      '',
      'Short Summary',
      summary.shortSummary || '',
      '',
      'Detailed Summary',
      summary.longSummary || '',
    ]
    if (summary.keyTakeaways?.length) {
      lines.push('', 'Key Takeaways')
      summary.keyTakeaways.forEach((t, i) => lines.push(`${i + 1}. ${t}`))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 600 }}>AI</span> Summary
        </h2>

        {/* Controls: A — slider — A  +  download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Small A */}
          <span
            onClick={() => setFontStep((s) => Math.max(0, s - 1))}
            className="text-indigo-600 dark:text-indigo-400"
            style={{ fontSize: '12px', fontWeight: 700, cursor: fontStep === 0 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1, opacity: fontStep === 0 ? 0.4 : 1 }}
          >A</span>

          {/* Step slider */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={FONT_STEPS.length - 1}
              step={1}
              value={fontStep}
              onChange={(e) => setFontStep(Number(e.target.value))}
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                width: '80px',
                height: '4px',
                borderRadius: '2px',
                background: `linear-gradient(to right, #6366f1 ${(fontStep / (FONT_STEPS.length - 1)) * 100}%, var(--slider-track-color) ${(fontStep / (FONT_STEPS.length - 1)) * 100}%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Large A */}
          <span
            onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
            className="text-indigo-600 dark:text-indigo-400"
            style={{ fontSize: '18px', fontWeight: 700, cursor: fontStep === FONT_STEPS.length - 1 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1, opacity: fontStep === FONT_STEPS.length - 1 ? 0.4 : 1 }}
          >A</span>

          {/* Divider */}
          <div className="bg-slate-200 dark:bg-slate-700" style={{ width: '1px', height: '20px', margin: '0 4px' }} />

          {/* Download */}
          <button
            onClick={handleDownload}
            type="button"
            title="Download summary"
            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors duration-150"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
          >
            <StudyHubIcon name="download" size={20} />
          </button>
        </div>
      </div>

      <article className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300" style={{ borderRadius: '16px', padding: '32px' }}>
        <div className="text-slate-700 dark:text-slate-300 transition-colors duration-150" style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Short Summary</p>
          <p style={{ marginBottom: '20px' }}>{summary.shortSummary}</p>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Detailed Summary</p>
          <p style={{ marginBottom: '20px' }}>{summary.longSummary}</p>
          {!!summary.keyTakeaways?.length && (
            <>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Key Takeaways</p>
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                {summary.keyTakeaways.map((item, idx) => <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>)}
              </ul>
            </>
          )}
        </div>
      </article>
    </section>
  )
}


function CollectionPanel({ buttonLabel, disabled, emptyLabel, items, loading, onCreate, onOpen, title, type }) {
  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h2>
        <button 
          disabled={disabled} 
          onClick={onCreate} 
          type="button"
          style={{ backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Generating...' : buttonLabel}
        </button>
      </header>
      {items.length ? (
        <div className="file-list">
          {items.map((item) => (
            <button className="file-row" key={item.id} onClick={() => onOpen(item.id)} type="button">
              <strong>{type === 'flashcard' ? item.setName : item.quizTitle}</strong>
              <small>{type === 'flashcard' ? `${item.totalCards} cards` : `${item.totalQuestions} questions`}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ padding: '32px', borderRadius: '12px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
          {emptyLabel}
        </div>
      )}
    </section>
  )
}

function FlashcardViewer({ set, onRegenerate, loading }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [slideDirection, setSlideDirection] = useState('')
  const cards = set.cards ?? []
  const card = cards[index]

  // Reset to first card when set changes
  const prevSetId = useState(set.id)
  if (prevSetId[0] !== set.id) { prevSetId[1](set.id); setIndex(0); setFlipped(false); setSlideDirection('') }

  return (
    <section>
      {/* Header row: title + regenerate */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
          {set.setName || 'Flashcards'}
        </h2>
        <button
          onClick={onRegenerate}
          disabled={loading}
          type="button"
          className={`flex items-center gap-1.5 py-2 px-4 border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
            loading 
              ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400' 
              : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm'
          }`}
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <StudyHubIcon name="refresh" size={14} />
          )}
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      <div className={`flashcard-3d-container slide-${slideDirection}`} key={index}>
        <div 
          onClick={() => setFlipped((value) => !value)} 
          className={`flashcard-3d-inner ${flipped ? 'is-flipped' : ''}`}
        >
          {/* Front Face */}
          <div className="flashcard-3d-face flashcard-3d-front">
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px', fontWeight: 500 }}>Question</div>
            <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', maxWidth: '80%', margin: 0 }}>
              {card ? card.frontContent : 'No cards'}
            </h3>
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', bottom: '16px', fontSize: '12px' }}>Click to flip</div>
          </div>

          {/* Back Face */}
          <div className="flashcard-3d-face flashcard-3d-back">
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px', fontWeight: 500, zIndex: 1 }}>Answer</div>
            <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', maxWidth: '80%', margin: 0, zIndex: 1 }}>
              {card ? card.backContent : 'No cards'}
            </h3>
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', bottom: '16px', fontSize: '12px', zIndex: 1 }}>Click to flip</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flashcard-progress-container">
        <div 
          className="flashcard-progress-bar" 
          style={{ width: `${cards.length ? ((index + 1) / cards.length) * 100 : 0}%` }} 
        />
      </div>
      
      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '28px', marginTop: '16px' }}>
        <button 
          disabled={index === 0} 
          onClick={() => { setSlideDirection('prev'); setIndex((value) => value - 1); setFlipped(false) }} 
          type="button" 
          className="flashcard-nav-btn"
          aria-label="Previous card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px)' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        
        <span className="flashcard-index-text">
          {cards.length ? index + 1 : 0} / {cards.length}
        </span>
        
        <button 
          disabled={index >= cards.length - 1} 
          onClick={() => { setSlideDirection('next'); setIndex((value) => value + 1); setFlipped(false) }} 
          type="button" 
          className="flashcard-nav-btn"
          aria-label="Next card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  )
}

function QuizPanel({ disabled, loading, onCreate, onOpen, quizzes }) {
  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Your Quizzes</h2>
        <button 
          disabled={disabled || loading} 
          onClick={() => onCreate('MEDIUM')} 
          type="button"
          style={{ backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            'Create Quiz'
          )}
        </button>
      </header>
      {quizzes.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quizzes.map((item) => (
            <div key={item.id} className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300 shadow-sm" style={{ borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{item.quizTitle || `Quiz #${item.id}`}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => onOpen(item.id)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-350 transition-colors" style={{ background: 'none', border: 'none', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <StudyHubIcon name="refresh" size={14} /> Take Quiz
                  </button>
                  <span className="text-slate-800 dark:text-slate-200 transition-colors" style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>0 attempts <StudyHubIcon name="chevron" size={12} style={{ transform: 'rotate(90deg)' }} /></span>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <StudyHubIcon name="more-vertical" size={16} />
                  </button>
                </div>
              </div>
              <div className="text-slate-800 dark:text-slate-200" style={{ fontSize: '13px', fontWeight: 600 }}>
                {item.totalQuestions || 6} Topics: <span className="text-slate-500 dark:text-slate-400 font-normal">Record of Changes &bull; Table of Contents &bull; Overview &bull; System Functions &bull; <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" style={{ fontWeight: 500 }}>Show 2 more topics</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ padding: '32px', borderRadius: '12px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
          No quizzes found
        </div>
      )}
    </section>
  )
}

function QuizViewer({ onBack, quiz }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // index -> 'correct' | 'incorrect' | 'skipped'
  const [selectedAnswers, setSelectedAnswers] = useState({}) // index -> key ('A', 'B', etc.)
  const [showResults, setShowResults] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [slideDirection, setSlideDirection] = useState('')

  const questions = quiz.questions ?? []
  const question = questions[index]
  const options = question
    ? [['A', question.optionA], ['B', question.optionB], ['C', question.optionC], ['D', question.optionD]]
    : []

  const encouragements = [
    "Đừng lo, bạn vẫn đang học mà!",
    "Không sao cả, vấp ngã là mẹ thành công!",
    "Hãy cố gắng ở câu tiếp theo nhé, bạn làm được mà!",
    "Sai một lần là thêm một lần nhớ, cố lên nào!",
    "Cứ tự tin lên, việc học là cả một hành trình!",
    "Không sao đâu, bạn đang tiến bộ lên mỗi ngày đó!"
  ]

  const correctEncouragements = [
    "Xuất sắc! Bạn đã làm rất tốt.",
    "Chính xác! Tặng bạn một bông hoa 🌸",
    "Tuyệt vời! Hãy tiếp tục phát huy nhé!",
    "Quá chuẩn! Bạn học bài rất kỹ đấy.",
    "Đúng rồi! Bạn thật thông minh.",
    "Chuẩn không cần chỉnh! Cố lên nhé!"
  ]
  const total = questions.length
  // Pagination: show 7 at a time
  const PAGE_SIZE = 7
  const pageStart = Math.floor(index / PAGE_SIZE) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, total)
  const pageNums = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i)

  const currentSelected = selectedAnswers[index] ?? ''
  const currentRevealed = !!currentSelected

  const move = (nextIndex) => {
    if (nextIndex > index) {
      setSlideDirection('next')
    } else if (nextIndex < index) {
      setSlideDirection('prev')
    }
    setIndex(nextIndex)
  }

  const correctCount = Object.values(answers).filter(val => val === 'correct').length
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0

  useEffect(() => {
    if (showResults) {
      const timer = setTimeout(() => {
        setAnimatedScore(scorePercent)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setAnimatedScore(0)
    }
  }, [showResults, scorePercent])

  if (showResults) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '440px', padding: '16px', textAlign: 'center' }}>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 quiz-results-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
          
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '22px', fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
            Quiz Results
          </h2>

          {/* Circular score gauge */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="140" height="140" className="quiz-svg-ring">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  {scorePercent >= 80 ? (
                    <>
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </>
                  ) : scorePercent >= 50 ? (
                    <>
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </>
                  )}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" floodColor={scorePercent >= 80 ? "#10b981" : scorePercent >= 50 ? "#6366f1" : "#f43f5e"} />
                </filter>
              </defs>
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r="54"
                strokeWidth="10"
                className="stroke-slate-100 dark:stroke-slate-700"
                fill="transparent"
                style={{ stroke: 'var(--slider-track-color)' }}
              />
              {/* Progress Circle */}
              <circle
                cx="70"
                cy="70"
                r="54"
                strokeWidth="10"
                stroke="url(#scoreGrad)"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray="339.292"
                strokeDashoffset={339.292 - (339.292 * animatedScore) / 100}
                className="quiz-circle-progress"
                filter="url(#glow)"
              />
            </svg>
            <div className="bg-white dark:bg-slate-800" style={{
              position: 'absolute',
              width: '106px',
              height: '106px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
            }}>
              <span className="text-slate-900 dark:text-white" style={{ fontSize: '32px', fontWeight: 800 }}>
                {scorePercent}%
              </span>
              <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
                SCORE
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {scorePercent >= 80 ? "Xuất sắc! Bạn làm rất tốt. 🎉" :
               scorePercent >= 50 ? "Khá tốt! Tiếp tục phát huy nhé. 👍" :
               "Cố gắng thêm chút nữa ở lần sau nhé! 💪"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>
              Bạn đã trả lời đúng <strong>{correctCount}</strong> trên tổng số <strong>{total}</strong> câu hỏi.
            </p>
          </div>

          {/* Detailed stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
            <div className="quiz-stat-box is-correct">
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Chính xác
              </span>
              <strong style={{ fontSize: '20px', color: '#047857', marginTop: '4px' }} className="dark:text-emerald-400">{correctCount} / {total}</strong>
            </div>
            <div className="quiz-stat-box is-incorrect">
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Sai / Bỏ qua
              </span>
              <strong style={{ fontSize: '20px', color: '#b91c1c', marginTop: '4px' }} className="dark:text-rose-400">{total - correctCount} / {total}</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '4px' }}>
            <button
              onClick={() => {
                setIndex(0)
                setAnswers({})
                setSelectedAnswers({})
                setShowResults(false)
              }}
              type="button"
              className="quiz-btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Retry
            </button>
            <button
              onClick={onBack}
              type="button"
              className={`quiz-btn-primary ${
                scorePercent >= 80 ? 'quiz-theme-green' :
                scorePercent >= 50 ? 'quiz-theme-indigo' :
                'quiz-theme-rose'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Done
            </button>
          </div>

        </div>
      </section>
    )
  }

  const handleSelectOption = (key) => {
    if (currentRevealed) return
    const isCorrect = key === question.correctOption
    setSelectedAnswers(prev => ({ ...prev, [index]: key }))
    setAnswers(prev => ({ ...prev, [index]: isCorrect ? 'correct' : 'incorrect' }))
  }

  const handleSkip = () => {
    if (!answers[index]) {
      setAnswers(prev => ({ ...prev, [index]: 'skipped' }))
    }
    move(Math.min(index + 1, total - 1))
  }

  const getOptionStyle = (key) => {
    const base = {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '16px 20px', borderRadius: '10px', border: '1.5px solid',
      cursor: currentRevealed ? 'default' : 'pointer', fontSize: '14px', fontWeight: 500,
      textAlign: 'left', transition: 'all 0.15s', background: 'var(--quiz-opt-bg)',
      width: '100%',
    }
    if (!currentRevealed) {
      return {
        ...base,
        borderColor: 'var(--quiz-opt-border)',
        color: 'var(--quiz-opt-color)',
      }
    }
    if (key === question.correctOption) {
      return { ...base, borderColor: 'var(--quiz-opt-correct-border)', backgroundColor: 'var(--quiz-opt-correct-bg)', color: 'var(--quiz-opt-correct-color)', boxShadow: '0 0 0 3px rgba(34,197,94,0.12)' }
    }
    if (currentSelected === key && key !== question.correctOption) {
      return { ...base, borderColor: 'var(--quiz-opt-incorrect-border)', backgroundColor: 'var(--quiz-opt-incorrect-bg)', color: 'var(--quiz-opt-incorrect-color)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
    }
    return { ...base, borderColor: 'var(--quiz-opt-border)', color: '#94a3b8' }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0', height: '100%' }}>

      {/* TOP BAR: Quit + pagination (centered) */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', alignItems: 'center', marginBottom: '24px' }}>
        {/* Quit */}
        <div>
          <button
            onClick={onBack}
            type="button"
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors duration-250"
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            Quit
          </button>
        </div>

        {/* Centered Pagination controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Prev page arrow */}
            <button
              disabled={pageStart === 0}
              onClick={() => move(pageStart - 1)}
              type="button"
              className="text-indigo-600 dark:text-indigo-400 disabled:text-slate-300 dark:disabled:text-slate-700 font-bold"
              style={{ background: 'none', border: 'none', cursor: pageStart === 0 ? 'default' : 'pointer', padding: '4px', fontSize: '16px' }}
            >‹</button>

            {/* Page numbers */}
            {pageNums.map((n) => {
              const isCurrent = index === n
              const status = answers[n] // 'correct' | 'incorrect' | 'skipped'

              // Default styles
              let bg = 'var(--quiz-num-bg)'
              let border = '1.5px solid var(--quiz-num-border)'
              let color = 'var(--quiz-num-color)'
              let boxShadow = 'none'

              if (status === 'correct') {
                bg = '#22c55e'
                border = '1.5px solid #22c55e'
                color = '#fff'
              } else if (status === 'incorrect') {
                bg = '#ef4444'
                border = '1.5px solid #ef4444'
                color = '#fff'
              } else if (status === 'skipped') {
                bg = '#94a3b8'
                border = '1.5px solid #94a3b8'
                color = '#fff'
              }

              if (isCurrent) {
                border = '2px solid #6366f1'
                boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'
                if (!status) {
                  bg = 'var(--quiz-num-active-bg)'
                  color = '#6366f1'
                }
              }

              return (
                <button
                  key={n}
                  onClick={() => move(n)}
                  type="button"
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border,
                    background: bg,
                    color,
                    fontWeight: isCurrent || status ? 700 : 500,
                    fontSize: '14px', cursor: 'pointer',
                    boxShadow,
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >{n + 1}</button>
              )
            })}

            {/* Next page arrow */}
            <button
              disabled={pageEnd >= total}
              onClick={() => move(pageEnd)}
              type="button"
              className="text-indigo-600 dark:text-indigo-400 disabled:text-slate-300 dark:disabled:text-slate-700 font-bold"
              style={{ background: 'none', border: 'none', cursor: pageEnd >= total ? 'default' : 'pointer', padding: '4px', fontSize: '16px' }}
            >›</button>
          </div>

          <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
            Showing {pageStart + 1}–{pageEnd} of {total} questions
          </span>
        </div>

        {/* Balance Spacer */}
        <div />
      </div>

      {/* QUESTION CARD */}
      {question ? (
        <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 quiz-card-container slide-${slideDirection}`} key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', padding: '32px', overflow: 'auto' }}>
          {/* Progress label */}
          <p className="text-slate-400 dark:text-slate-500 font-medium" style={{ fontSize: '13px', marginBottom: '16px', margin: '0 0 16px', textAlign: 'center' }}>
            Question: {index + 1}/{total}
          </p>

          {/* Question text */}
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '32px', lineHeight: 1.5, margin: '0 0 32px', textAlign: 'center' }}>
            {question.questionText}
          </h2>

          {/* 2×2 option grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
            {options.map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelectOption(key)}
                type="button"
                style={getOptionStyle(key)}
              >
                {/* Option letter badge */}
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  backgroundColor: currentRevealed && key === question.correctOption ? 'var(--quiz-opt-correct-border)'
                    : currentRevealed && currentSelected === key && key !== question.correctOption ? 'var(--quiz-opt-incorrect-border)'
                    : 'var(--quiz-num-bg)',
                  color: (currentRevealed && key === question.correctOption) || (currentRevealed && currentSelected === key && key !== question.correctOption)
                    ? '#fff' : 'var(--quiz-num-color)',
                  transition: 'all 0.15s',
                }}>
                  {key}
                </span>
                {value}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {currentRevealed && (
            currentSelected === question.correctOption ? (
              <div 
                className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-teal-900 dark:text-teal-300 transition-colors"
                style={{
                  padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>🎉</span>
                  <strong style={{ fontSize: '15px', color: '#0d9488' }}>
                    {correctEncouragements[index % correctEncouragements.length]}
                  </strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }} className="text-teal-700 dark:text-teal-400">
                  Hãy tiếp tục phát huy nhé!
                </div>
              </div>
            ) : (
              <div 
                className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 transition-colors"
                style={{
                  padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <strong style={{ fontSize: '15px', color: '#e11d48' }}>
                    {encouragements[index % encouragements.length]}
                  </strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#4c0519' }} className="dark:text-rose-200">
                  Đáp án đúng: <span style={{ fontWeight: 700 }}>{question.correctOption}. {
                    question.correctOption === 'A' ? question.optionA :
                    question.correctOption === 'B' ? question.optionB :
                    question.correctOption === 'C' ? question.optionC :
                    question.optionD
                  }</span>
                </div>
                {question.explanation && (
                  <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.85 }}>
                    Giải thích: {question.explanation}
                  </div>
                )}
              </div>
            )
          )}

          {/* Actions: Previous | Skip | Next */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
            <button
              disabled={index === 0}
              onClick={() => move(index - 1)}
              type="button"
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-700 font-semibold transition-colors"
              style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', cursor: index === 0 ? 'default' : 'pointer' }}
            >Previous</button>

            <button
              onClick={handleSkip}
              type="button"
              disabled={currentRevealed || index >= total - 1}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-700 font-semibold transition-colors"
              style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', cursor: (currentRevealed || index >= total - 1) ? 'default' : 'pointer' }}
            >Skip</button>

            {index >= total - 1 ? (
              <button
                onClick={() => setShowResults(true)}
                type="button"
                className="font-semibold transition-colors border-none"
                style={{ padding: '10px 28px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontSize: '14px', cursor: 'pointer' }}
              >Complete</button>
            ) : (
              <button
                disabled={index >= total - 1}
                onClick={() => move(index + 1)}
                type="button"
                className="font-semibold transition-colors border-none"
                style={{ padding: '10px 28px', borderRadius: '8px', background: index >= total - 1 ? 'var(--quiz-num-border)' : '#6366f1', color: index >= total - 1 ? 'var(--quiz-num-color)' : '#fff', fontSize: '14px', cursor: index >= total - 1 ? 'default' : 'pointer' }}
              >Next</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '15px' }}>
          Quiz has no questions
        </div>
      )}
    </section>
  )
}

