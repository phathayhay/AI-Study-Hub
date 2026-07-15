import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { studyTabs } from '../../data/studyHubData'
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  getDocumentSummary,
  getDocumentFlashcardSets,
  getDocumentQuizzes,
  getFlashcardSet,
  getQuiz,
} from '../../features/ai/aiService'

import OriginalDocument from './components/OriginalDocument'
import { SummaryTab } from './components/SummaryTab'
import { FlashcardTab } from './components/FlashcardTab'
import { QuizTab } from './components/QuizTab'
import { ChatbotTab } from './components/ChatbotTab'

export default function StudySessionPage({ activeTab: propActiveTab, file, onBack, onTabChange }) {
  const documentId = file?.documentId ?? file?.id
  const [activeTab, setActiveTab] = useState(propActiveTab || 'original')
  
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab])

  const handleTabChangeLocal = (tabId) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  const [summary, setSummary] = useState(null)
  const [flashcardSet, setFlashcardSet] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialAiLoading, setInitialAiLoading] = useState(false)
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

  const isMissingAiContentError = (requestError) => {
    const normalizedMessage = String(
      requestError?.message ||
      requestError?.data?.message ||
      ''
    ).toLowerCase()

    return requestError?.status === 404
      || normalizedMessage.includes('summary not found for this document')
      || normalizedMessage.includes('resource not found')
      || normalizedMessage.includes('flashcard set not found')
      || normalizedMessage.includes('flashcards not found')
      || normalizedMessage.includes('quiz not found')
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
    setInitialAiLoading(true)
    setError('')
    setSummary(null)
    setFlashcardSet(null)
    setQuiz(null)

    Promise.allSettled([
      getDocumentSummary(documentId),
      getDocumentQuizzes(documentId),
      getDocumentFlashcardSets(documentId),
    ])
      .then(async ([summaryResult, quizzesResult, flashcardsResult]) => {
        if (!active) return

        if (summaryResult.status === 'fulfilled') {
          setSummary(summaryResult.value)
        } else if (!isMissingAiContentError(summaryResult.reason)) {
          setError(summaryResult.reason.message)
        }

        if (quizzesResult.status === 'fulfilled') {
          setQuizzes(Array.isArray(quizzesResult.value) ? quizzesResult.value : [])
        }

        if (flashcardsResult.status === 'fulfilled') {
          const sets = flashcardsResult.value
          if (Array.isArray(sets) && sets.length > 0) {
            try {
              const set = await getFlashcardSet(sets[0].id)
              if (active) setFlashcardSet(set)
            } catch (requestError) {
              if (active) setError(requestError.message)
            }
          }
        } else if (!isMissingAiContentError(flashcardsResult.reason)) {
          setError(flashcardsResult.reason.message)
        }
      })
      .finally(() => { if (active) setInitialAiLoading(false) })
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
                      onClick={() => handleTabChangeLocal(tab.id)} 
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
                    <button className="border border-indigo-500 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors duration-200" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} type="button">
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
                  <SummaryTab 
                    documentId={documentId} 
                    summary={summary} 
                    onGenerateSummary={handleSummary} 
                    loading={loading} 
                    initialAiLoading={initialAiLoading} 
                  />
                )}
                
                {activeTab === 'flashcards' && (
                  <FlashcardTab 
                    documentId={documentId} 
                    flashcardSet={flashcardSet} 
                    onGenerateFlashcards={regenerateFlashcards} 
                    loading={loading} 
                    initialAiLoading={initialAiLoading} 
                  />
                )}

                {activeTab === 'quizzes' && (
                  <QuizTab 
                    documentId={documentId} 
                    quiz={quiz} 
                    quizzes={quizzes} 
                    loading={loading} 
                    onCreateQuiz={handleQuiz} 
                    onOpenQuiz={openQuiz} 
                    setQuiz={setQuiz} 
                  />
                )}
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
          <ChatbotTab 
            documentId={documentId} 
            file={file} 
            rightPanelWidth={rightPanelWidth} 
            isResizing={isResizing} 
            setIsResizing={setIsResizing} 
          />
        </div>
      </main>
    </div>
  )
}
