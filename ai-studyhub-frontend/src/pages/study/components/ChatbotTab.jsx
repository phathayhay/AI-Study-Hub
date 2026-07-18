import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import {
  getUserChatSessions,
  getChatSessionMessages,
  createChatSession,
  sendChatMessage,
} from '../../../features/ai/aiService'

export function ChatbotTab({ documentId, file, rightPanelWidth, onAiUsageUpdated, aiQuotaReached = false }) {
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false)
  const [chatSendLoading, setChatSendLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatScope, setChatScope] = useState('document') // 'document' or 'general'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleScopeChange = (scope) => {
    setChatScope(scope)
    setChatMessagesLoading(true)
    setChatMessages([])
    setCurrentSessionId(null)
    setIsDropdownOpen(false)
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])



  useEffect(() => {
    let active = true

    getUserChatSessions()
      .then((res) => {
        if (!active) return
        const list = res?.data || res || []
        const isArr = Array.isArray(list)
        
        
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
    if (aiQuotaReached) {
      window.showToast?.("You have reached today's AI request limit. Please try again tomorrow or upgrade your plan.", 'error')
      return
    }

    setChatSendLoading(true)
    if (!overrideContent) setChatInput('')

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
        } else {
          throw new Error('Không thể tạo phiên trò chuyện')
        }
      }

      const sendRes = await sendChatMessage(sessionId, textToSend)
      const aiReply = sendRes?.data || sendRes
      if (aiReply) {
        setChatMessages(prev => [...prev, aiReply])
        onAiUsageUpdated?.()
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
      prompt = 'Write a concise paragraph summarizing the main content of this document. Respond in English.'
    } else if (type === 'concept') {
      prompt = 'Explain the most important concepts presented in this document. Respond in English.'
    } else if (type === 'compare') {
      prompt = 'Compare the main arguments in this document and provide a clear conclusion. Respond in English.'
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

  return (
    <aside style={{ width: `${rightPanelWidth}px`, flexShrink: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px', flexShrink: 0 }}>
          <h3 className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Tutor</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', padding: '24px', overflow: 'hidden' }}>
          
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
                  <button onClick={() => handleSuggestionClick('summary')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm cursor-pointer" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px' }}>Write a paragraph...</button>
                  <button onClick={() => handleSuggestionClick('concept')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm cursor-pointer" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px' }}>Explain concept...</button>
                  <button onClick={() => handleSuggestionClick('compare')} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm cursor-pointer" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '24px' }}>Compare with...</button>
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
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm cursor-pointer"
                  style={{ 
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 cursor-pointer"
                    style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '50%', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
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
                        onClick={() => handleScopeChange('document')}
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
                        onClick={() => handleScopeChange('general')}
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
                  className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer"
                  style={{ 
                    border: 'none', 
                    background: 'transparent', 
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
                  disabled={chatSendLoading || aiQuotaReached}
                  className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white transition-all duration-200 shadow-sm cursor-pointer"
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    border: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    opacity: chatSendLoading || aiQuotaReached ? 0.6 : 1,
                    cursor: aiQuotaReached ? 'not-allowed' : 'pointer',
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
  )
}
