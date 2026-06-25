import { useEffect, useState } from 'react'
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
} from '../../features/ai/aiService'

const getDynamicFontSize = (text = '', baseSize = 24) => {
  const len = text.length
  if (len > 120) return '14px'
  if (len > 80) return '16px'
  if (len > 40) return '18px'
  return `${baseSize}px`
}

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
    <div className="study-shell" style={{ backgroundColor: '#f8fafc', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <main className="study-main" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', userSelect: isResizing ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', overflow: 'hidden' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '-1px', position: 'relative', zIndex: 10, paddingLeft: '24px', paddingRight: '24px' }}>
              <nav className="study-tabs" style={{ display: 'flex', gap: '4px' }}>
                {studyTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                  <button 
                    key={tab.id} 
                    onClick={() => onTabChange(tab.id)} 
                    type="button"
                    style={{
                      padding: isActive ? '12px 24px' : '10px 20px',
                      border: isActive ? '1px solid #e2e8f0' : 'none',
                      borderBottom: isActive ? '2px solid #fff' : 'none',
                      backgroundColor: isActive ? '#fff' : '#f8fafc',
                      color: isActive ? '#0f172a' : '#818cf8',
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px',
                      borderBottomLeftRadius: '0',
                      borderBottomRightRadius: '0',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                )})}
              </nav>
            </div>

            <div style={{ flex: 1, backgroundColor: activeTab === 'flashcards' ? '#f8fafc' : '#fff', borderRadius: '16px', border: activeTab === 'flashcards' ? 'none' : '1px solid #e2e8f0', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>

              {/* CONTENT AREA */}
              <div style={{ flex: 1, padding: activeTab === 'original' ? '0' : activeTab === 'flashcards' ? '14px 20px' : '24px', overflowY: activeTab === 'original' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
                {!documentId && <p className="api-status api-status--error">Tài liệu này chưa có documentId từ backend.</p>}
                {error && <p className="api-status api-status--error">{error}</p>}
                
                <div style={{ display: activeTab === 'original' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
                  {/* SINGLE FILE HEADER */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fdfdff', flexShrink: 0 }}>
                    <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: '#6366f1', cursor: 'pointer' }}>
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
                    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '16px', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                      <h2 style={{ fontSize: '28px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, margin: 0 }}>
                        <span style={{ color: '#6366f1', fontWeight: 600 }}>AI</span> Summary
                      </h2>
                      <p style={{ color: '#0f172a', marginTop: '16px', fontSize: '15px', fontWeight: 500, textAlign: 'center' }}>
                        Create a clear and easy-to-understand summary of your content
                      </p>
                      <button 
                        onClick={handleSummary}
                        disabled={!documentId || loading}
                        style={{ marginTop: '24px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
                      >
                        <StudyHubIcon name="sparkles" size={16} /> Generate
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'flashcards' && (
                flashcardSet ? (
                  <FlashcardViewer set={flashcardSet} onRegenerate={regenerateFlashcards} loading={loading} />
                ) : loading ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#6366f1', padding: '48px' }}>
                    <div style={{ width: '48px', height: '48px', border: '4px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569', margin: 0 }}>Generating flashcards...</p>
                  </div>
                ) : (
                  <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '16px', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                      <h2 style={{ fontSize: '28px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, margin: 0 }}>
                        <span style={{ color: '#6366f1', fontWeight: 600 }}>AI</span> Flashcards
                      </h2>
                      <p style={{ color: '#0f172a', marginTop: '16px', fontSize: '15px', fontWeight: 500, textAlign: 'center' }}>
                        Create a beautiful set of custom flashcards from your content
                      </p>
                      {error && (
                        <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '12px', textAlign: 'center', maxWidth: '400px' }}>
                          Lỗi: {error}
                        </p>
                      )}
                      <button 
                        onClick={regenerateFlashcards}
                        disabled={!documentId || loading}
                        style={{ marginTop: '24px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
                      >
                        <StudyHubIcon name="sparkles" size={16} /> Generate Flashcards
                      </button>
                    </div>
                  </div>
                )
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
            <div style={{ 
              width: '4px', 
              height: '40px', 
              backgroundColor: isResizing ? '#6366f1' : '#cbd5e1', 
              borderRadius: '4px',
              transition: 'all 0.2s',
              opacity: isResizing ? 1 : 0.6
            }} />
          </div>

          {/* RIGHT COLUMN (AI TUTOR) */}
          <aside style={{ width: `${rightPanelWidth}px`, flexShrink: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px', flexShrink: 0 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#475569' }}>AI Tutor</h3>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Scrollable Content */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', paddingRight: '8px', marginRight: '-8px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '16px', marginTop: '32px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Have a Question about your import?</h4>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', lineHeight: 1.6, maxWidth: '280px' }}>You can ask questions about your imported content, and your answers will appear here</p>
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Write a paragraph...</button>
                      <button style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Explain concept...</button>
                      <button style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Compare with...</button>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div style={{ marginTop: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                  <input 
                    type="text" 
                    placeholder="Ask AI assistant..." 
                    style={{ width: '100%', border: 'none', padding: '16px', fontSize: '14px', outline: 'none', color: '#0f172a', minWidth: 0 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '16px', color: '#94a3b8' }}>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94a3b8' }}><StudyHubIcon name="file" size={20} /></button>
                      <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94a3b8' }}><StudyHubIcon name="mic" size={20} /></button>
                    </div>
                    <button style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(79, 70, 229, 0.3)' }}>
                      <StudyHubIcon name="arrow-up" size={16} />
                    </button>
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
      <button className="ai-generate-button" disabled={disabled} onClick={onGenerate} type="button">
        <StudyHubIcon name="sparkle" size={16} /> {loading ? 'Generating...' : 'Generate'}
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
        <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>AI</span> Summary
        </h2>

        {/* Controls: A — slider — A  +  download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Small A */}
          <span
            onClick={() => setFontStep((s) => Math.max(0, s - 1))}
            style={{ fontSize: '12px', fontWeight: 700, color: fontStep === 0 ? '#cbd5e1' : '#6366f1', cursor: fontStep === 0 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1 }}
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
                background: `linear-gradient(to right, #6366f1 ${(fontStep / (FONT_STEPS.length - 1)) * 100}%, #e0e7ff ${(fontStep / (FONT_STEPS.length - 1)) * 100}%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Large A */}
          <span
            onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
            style={{ fontSize: '18px', fontWeight: 700, color: fontStep === FONT_STEPS.length - 1 ? '#cbd5e1' : '#6366f1', cursor: fontStep === FONT_STEPS.length - 1 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1 }}
          >A</span>

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />

          {/* Download */}
          <button
            onClick={handleDownload}
            type="button"
            title="Download summary"
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e7ff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
          >
            <StudyHubIcon name="download" size={20} />
          </button>
        </div>
      </div>

      <article style={{ border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#fff', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: `${fontSize}px`, color: '#334155', lineHeight: 1.7, transition: 'font-size 0.15s ease' }}>
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
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h2>
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
        <div style={{ backgroundColor: '#f5f3ff', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
          {emptyLabel}
        </div>
      )}
    </section>
  )
}

function FlashcardViewer({ set, onRegenerate, loading }) {
  const [isLearnModeActive, setIsLearnModeActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  
  const [sessionUnlearnedIds, setSessionUnlearnedIds] = useState(new Set())
  const [sessionLearnedIds, setSessionLearnedIds] = useState(new Set())
  const [starredIds, setStarredIds] = useState(new Set())
  
  const cards = set.cards ?? []
  const [currentDeck, setCurrentDeck] = useState(cards)

  const [isMatchModeActive, setIsMatchModeActive] = useState(false)
  const [matchGrid, setMatchGrid] = useState([])
  const [selectedMatchItem, setSelectedMatchItem] = useState(null)
  const [matchedItemIds, setMatchedItemIds] = useState(new Set())
  const [wrongPairIds, setWrongPairIds] = useState([])
  const [correctPairIds, setCorrectPairIds] = useState([])
  const [gameTime, setGameTime] = useState(0)
  const [matchGameStatus, setMatchGameStatus] = useState('PLAYING') // 'PLAYING' | 'COMPLETED'
  const [isMuted, setIsMuted] = useState(false)

  // Test Mode States
  const [isTestModeActive, setIsTestModeActive] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testWordCount, setTestWordCount] = useState('')
  const [testDeck, setTestDeck] = useState([])
  const [testIndex, setTestIndex] = useState(0)
  const [testOptions, setTestOptions] = useState([])
  const [testSelectedOption, setTestSelectedOption] = useState(null)
  const [testShowCorrective, setTestShowCorrective] = useState(false)
  const [testScore, setTestScore] = useState(0)

  // Reset states when set changes
  const prevSetId = useState(set.id)
  if (prevSetId[0] !== set.id) { 
    prevSetId[1](set.id)
    setIndex(0)
    setFlipped(false)
    setSessionUnlearnedIds(new Set())
    setSessionLearnedIds(new Set())
    setStarredIds(new Set())
    setCurrentDeck(set.cards ?? [])
    setIsLearnModeActive(false)
    setIsMatchModeActive(false)
    setMatchGrid([])
    setSelectedMatchItem(null)
    setMatchedItemIds(new Set())
    setWrongPairIds([])
    setCorrectPairIds([])
    setGameTime(0)
    setMatchGameStatus('PLAYING')
    setIsTestModeActive(false)
    setShowTestModal(false)
    setTestWordCount('')
    setTestDeck([])
    setTestIndex(0)
    setTestOptions([])
    setTestSelectedOption(null)
    setTestShowCorrective(false)
    setTestScore(0)
  }

  const toggleStar = (cardId, e) => {
    e.stopPropagation()
    setStarredIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  const speakText = (text, e) => {
    e.stopPropagation()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const jaVoice = voices.find(v => v.lang.startsWith('ja'))
      if (jaVoice) utterance.voice = jaVoice
      utterance.lang = 'ja-JP'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleUnlearned = () => {
    const currentCard = currentDeck[index]
    if (!currentCard) return
    setSessionUnlearnedIds(prev => {
      const next = new Set(prev)
      next.add(currentCard.id)
      return next
    })
    setSessionLearnedIds(prev => {
      const next = new Set(prev)
      next.delete(currentCard.id)
      return next
    })
    setIndex(idx => idx + 1)
    setFlipped(false)
  }

  const handleLearned = () => {
    const currentCard = currentDeck[index]
    if (!currentCard) return
    setSessionLearnedIds(prev => {
      const next = new Set(prev)
      next.add(currentCard.id)
      return next
    })
    setSessionUnlearnedIds(prev => {
      const next = new Set(prev)
      next.delete(currentCard.id)
      return next
    })
    setIndex(idx => idx + 1)
    setFlipped(false)
  }

  const restartAll = () => {
    setSessionUnlearnedIds(new Set())
    setSessionLearnedIds(new Set())
    setIndex(0)
    setFlipped(false)
    setCurrentDeck(cards)
  }

  const studyUnlearnedOnly = () => {
    const unlearnedList = cards.filter(c => sessionUnlearnedIds.has(c.id))
    setCurrentDeck(unlearnedList)
    setSessionUnlearnedIds(new Set())
    setSessionLearnedIds(new Set())
    setIndex(0)
    setFlipped(false)
  }

  const startLearnMode = () => {
    setIsLearnModeActive(true)
    setIndex(0)
    setFlipped(false)
    setSessionUnlearnedIds(new Set())
    setSessionLearnedIds(new Set())
    setCurrentDeck(cards)
  }

  const shuffleArray = (array) => {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const generateTestQuestion = (qIndex, qDeck) => {
    const currentCard = qDeck[qIndex]
    if (!currentCard) return
    
    // Correct answer is the current card
    const correctOption = {
      cardId: currentCard.id,
      text: currentCard.backContent,
      isCorrect: true
    }
    
    // Sample incorrect answers from other cards in the full set
    const otherCards = cards.filter(c => c.id !== currentCard.id)
    const shuffledOthers = shuffleArray(otherCards)
    const incorrectOptions = shuffledOthers.slice(0, 3).map(c => ({
      cardId: c.id,
      text: c.backContent,
      isCorrect: false
    }))
    
    // Combine and shuffle the options
    const allOptions = shuffleArray([correctOption, ...incorrectOptions])
    setTestOptions(allOptions)
    setTestSelectedOption(null)
    setTestShowCorrective(false)
  }

  const startMatchGame = () => {
    if (cards.length === 0) return
    
    let selectedCards = [...cards]
    if (selectedCards.length > 6) {
      const shuffled = shuffleArray(selectedCards)
      selectedCards = shuffled.slice(0, 6)
    }
    
    const items = []
    selectedCards.forEach(c => {
      items.push({
        id: `${c.id}-front`,
        cardId: c.id,
        text: c.frontContent,
        type: 'front'
      })
      items.push({
        id: `${c.id}-back`,
        cardId: c.id,
        text: c.backContent,
        type: 'back'
      })
    })
    
    const shuffledItems = shuffleArray(items)
    
    setMatchGrid(shuffledItems)
    setSelectedMatchItem(null)
    setMatchedItemIds(new Set())
    setWrongPairIds([])
    setCorrectPairIds([])
    setGameTime(0)
    setMatchGameStatus('PLAYING')
    setIsMatchModeActive(true)
  }

  const handleMatchItemClick = (item) => {
    if (matchedItemIds.has(item.id) || wrongPairIds.includes(item.id) || correctPairIds.includes(item.id)) {
      return
    }
    
    if (!selectedMatchItem) {
      setSelectedMatchItem(item)
      return
    }
    
    if (selectedMatchItem.id === item.id) {
      setSelectedMatchItem(null)
      return
    }
    
    if (selectedMatchItem.cardId === item.cardId && selectedMatchItem.type !== item.type) {
      const newCorrect = [selectedMatchItem.id, item.id]
      setCorrectPairIds(newCorrect)
      setSelectedMatchItem(null)
      
      setTimeout(() => {
        setMatchedItemIds(prev => {
          const next = new Set(prev)
          next.add(newCorrect[0])
          next.add(newCorrect[1])
          
          if (next.size === matchGrid.length) {
            setMatchGameStatus('COMPLETED')
          }
          return next
        })
        setCorrectPairIds([])
      }, 500)
    } else {
      const newWrong = [selectedMatchItem.id, item.id]
      setWrongPairIds(newWrong)
      setSelectedMatchItem(null)
      
      setTimeout(() => {
        setWrongPairIds([])
      }, 2000)
    }
  }

  useEffect(() => {
    if (!isMatchModeActive || matchGameStatus !== 'PLAYING') return undefined
    
    const interval = setInterval(() => {
      setGameTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isMatchModeActive, matchGameStatus])

  useEffect(() => {
    if (!isLearnModeActive) {
      setIndex(0);
    }
  }, [isLearnModeActive])

  const isFinished = index >= currentDeck.length && currentDeck.length > 0
  const card = currentDeck[index]

  if (isLearnModeActive) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* GAMIFIED STUDY CONTAINER */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          borderRadius: '24px',
          padding: '40px 32px',
          minHeight: '460px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
          border: '1px solid #bae6fd',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)'
        }}>
          {/* Wave SVG Background */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 1 }} viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path fill="#0284c7" fillOpacity="0.08" d="M0,96L48,112C96,128,192,160,288,181.3C384,203,480,213,576,197.3C672,181,768,139,864,128C960,117,1056,139,1152,144C1248,149,1344,139,1392,133.3L1440,128L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"></path>
            <path fill="#0284c7" fillOpacity="0.15" d="M0,160L48,154.7C96,149,192,139,288,122.7C384,107,480,85,576,96C672,107,768,149,864,154.7C960,160,1056,128,1152,112C1248,96,1344,96,1392,96L1440,96L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"></path>
          </svg>

          {/* Top Control Panel */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative', marginBottom: '24px' }}>
            {/* Left: Unlearned Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: '12px', marginBottom: '4px', border: '1px solid #fca5a5' }}>Chưa thuộc</span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{sessionUnlearnedIds.size}</span>
            </div>

            {/* Center: Current Progress */}
            {!isFinished && (
              <div style={{ backgroundColor: '#e0f2fe', color: '#0384c7', fontSize: '15px', fontWeight: 800, padding: '8px 20px', borderRadius: '20px', border: '1.5px solid #bae6fd' }}>
                {index + 1} / {currentDeck.length}
              </div>
            )}

            {/* Right: Learned Counter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', backgroundColor: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', marginBottom: '4px', border: '1px solid #bbf7d0' }}>Đã thuộc</span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>{sessionLearnedIds.size}</span>
            </div>

            {/* Absolute Top-Right Quit Button */}
            <div style={{ position: 'absolute', top: '-16px', right: '-16px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsLearnModeActive(false)}
                title="Thoát chế độ học"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  border: '1.5px solid #e2e8f0',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#64748b' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* MAIN INTERACTIVE AREA */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '40px', zIndex: 5, flex: 1, margin: '20px 0' }}>
            {!isFinished ? (
              <>
                {/* Left Circular Button (X) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUnlearned(); }}
                  title="Chưa thuộc"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    border: '2.5px solid #fca5a5',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.12)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* 3D Flip Card */}
                <div 
                  onClick={() => setFlipped((value) => !value)}
                  style={{ 
                    perspective: '1000px', 
                    height: '280px', 
                    width: '440px',
                    position: 'relative', 
                    cursor: 'pointer'
                  }}
                >
                  <div 
                    style={{ 
                      position: 'absolute', 
                      width: '100%', 
                      height: '100%', 
                      transformStyle: 'preserve-3d', 
                      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
                      transform: flipped ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    {/* FRONT FACE */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        top: 0, 
                        left: 0, 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden', 
                        borderRadius: '20px', 
                        border: '1px solid #bae6fd', 
                        padding: '32px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: '#fff', 
                        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.08), 0 2px 8px rgba(2, 132, 199, 0.03)',
                        zIndex: 2
                      }}
                    >
                      <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>Thuật ngữ</div>
                      <div 
                        style={{ 
                          maxHeight: '170px', 
                          overflowY: 'auto', 
                          width: '100%', 
                          display: 'block', 
                          textAlign: 'center', 
                          padding: '0 16px',
                        }}
                      >
                        <h3 style={{ fontSize: getDynamicFontSize(card.frontContent, 26), fontWeight: 700, color: '#0f172a', textAlign: 'center', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                          {card.frontContent}
                        </h3>
                      </div>
                      <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', color: '#94a3b8' }}>Bấm để lật xem nghĩa</div>

                      {/* Card utility buttons */}
                      <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => speakText(card.frontContent, e)}
                          title="Phát âm từ vựng"
                          style={{ border: 'none', background: '#f0f9ff', color: '#0284c7', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          🔊
                        </button>
                        <button 
                          onClick={(e) => toggleStar(card.id, e)}
                          title="Đánh dấu thẻ"
                          style={{ border: 'none', background: starredIds.has(card.id) ? '#fffbeb' : '#f8fafc', color: starredIds.has(card.id) ? '#d97706' : '#94a3b8', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: starredIds.has(card.id) ? '1px solid #fde68a' : '1px solid #e2e8f0' }}
                        >
                          ⭐
                        </button>
                      </div>
                    </div>

                    {/* BACK FACE */}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        width: '100%', 
                        height: '100%', 
                        top: 0, 
                        left: 0, 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden', 
                        borderRadius: '20px', 
                        border: '1px solid #bae6fd', 
                        padding: '32px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: '#fff', 
                        boxShadow: '0 12px 30px rgba(2, 132, 199, 0.08), 0 2px 8px rgba(2, 132, 199, 0.03)',
                        transform: 'rotateY(180deg)',
                        zIndex: 1
                      }}
                    >
                      <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>Ý nghĩa</div>
                      <div 
                        style={{ 
                          maxHeight: '170px', 
                          overflowY: 'auto', 
                          width: '100%', 
                          display: 'block', 
                          textAlign: 'center', 
                          padding: '0 16px',
                        }}
                      >
                        <h3 style={{ fontSize: getDynamicFontSize(card.backContent, 24), fontWeight: 700, color: '#0f172a', textAlign: 'center', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                          {card.backContent}
                        </h3>
                      </div>
                      <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', color: '#94a3b8' }}>Bấm để xem lại từ gốc</div>

                      {/* Card utility buttons */}
                      <div style={{ position: 'absolute', bottom: '12px', right: '16px', display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => speakText(card.backContent, e)}
                          title="Phát âm từ vựng"
                          style={{ border: 'none', background: '#f0f9ff', color: '#0284c7', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          🔊
                        </button>
                        <button 
                          onClick={(e) => toggleStar(card.id, e)}
                          title="Đánh dấu thẻ"
                          style={{ border: 'none', background: starredIds.has(card.id) ? '#fffbeb' : '#f8fafc', color: starredIds.has(card.id) ? '#d97706' : '#94a3b8', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: starredIds.has(card.id) ? '1px solid #fde68a' : '1px solid #e2e8f0' }}
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Circular Button (Check) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLearned(); }}
                  title="Đã thuộc"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    border: '2.5px solid #86efac',
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(34, 197, 94, 0.12)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </>
            ) : (
              /* SESSION COMPLETED SUMMARY SCREEN */
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '40px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 15px 35px rgba(2, 132, 199, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 10
              }}>
                <span style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</span>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Hoàn thành lượt học!</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Bạn đã ôn tập xong tất cả {currentDeck.length} thẻ từ vựng.</p>

                {/* Progress breakdown */}
                <div style={{ display: 'flex', width: '100%', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ flex: 1, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Chưa thuộc</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', margin: '8px 0 0' }}>{sessionUnlearnedIds.size}</h4>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>Đã thuộc</span>
                    <h4 style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', margin: '8px 0 0' }}>{sessionLearnedIds.size}</h4>
                  </div>
                </div>

                {/* Summary Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                  {sessionUnlearnedIds.size > 0 && (
                    <button 
                      onClick={studyUnlearnedOnly}
                      style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0369a1' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0284c7' }}
                    >
                      🔁 Học tiếp {sessionUnlearnedIds.size} từ chưa thuộc
                    </button>
                  )}
                  <button 
                    onClick={restartAll}
                    style={{ width: '100%', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                  >
                    🔄 Học lại từ đầu (Tất cả từ)
                  </button>
                  <button 
                    onClick={() => setIsLearnModeActive(false)}
                    style={{ width: '100%', backgroundColor: '#fff', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
                  >
                    Thoát chế độ học
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Instruction */}
          {!isFinished && (
            <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 500, zIndex: 10, textAlign: 'center', opacity: 0.8 }}>
              💡 Mẹo: Bạn có thể click chuột trái để lật thẻ
            </div>
          )}
        </div>
      </section>
    )
  }

  if (isMatchModeActive) {
    const isCompleted = matchGameStatus === 'COMPLETED';
    const formatMatchTime = (secs) => {
      const mm = Math.floor(secs / 60).toString().padStart(2, '0')
      const ss = (secs % 60).toString().padStart(2, '0')
      return `${mm} : ${ss}`
    }
    
    return (
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes card-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
          .card-wrong {
            animation: card-shake 0.4s ease-in-out;
            background-color: #fee2e2 !important;
            border-color: #ef4444 !important;
            color: #b91c1c !important;
            font-weight: bold !important;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15) !important;
          }
          .card-correct {
            background-color: #dcfce7 !important;
            border-color: #22c55e !important;
            color: #15803d !important;
            font-weight: bold !important;
            box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15) !important;
            transform: scale(0.95);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .card-item {
            transition: all 0.2s ease;
          }
          .card-item:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
          }
        `}</style>
        
        {/* FOREST THEME CONTAINER */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #fefce8 0%, #f0fdf4 100%)',
          borderRadius: '24px',
          padding: '24px',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          overflow: 'hidden',
          border: '2px solid #bbf7d0',
          boxShadow: '0 12px 40px rgba(22, 163, 74, 0.06)',
          flex: 1
        }}>
          {/* Forest Graphic Background */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', pointerEvents: 'none', zIndex: 1 }}>
            {/* Green Hills SVG */}
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 1000 140" preserveAspectRatio="none">
              <path d="M0,140 L1000,140 L1000,60 C900,40 800,90 700,80 C600,70 500,30 400,50 C300,70 150,20 0,60 Z" fill="#86efac" opacity="0.6" />
              <path d="M0,140 L1000,140 L1000,80 C920,70 820,110 750,100 C680,90 580,50 480,70 C380,90 200,40 0,90 Z" fill="#22c55e" opacity="0.4" />
              <path d="M0,140 L1000,140 L1000,110 C930,105 850,120 780,115 C650,100 550,85 450,100 C300,115 150,90 0,110 Z" fill="#15803d" opacity="0.7" />
            </svg>
          </div>
          
          {/* Floating Leaves (side decoration) */}
          <div style={{ position: 'absolute', right: '-30px', top: '10%', width: '120px', height: '240px', opacity: 0.8, pointerEvents: 'none', zIndex: 1 }}>
            <svg viewBox="0 0 100 200" style={{ width: '100%', height: '100%' }}>
              <path d="M10,0 C40,20 60,60 50,100 C40,140 10,180 0,200 C30,170 50,130 55,90 C60,50 40,10 10,0 Z" fill="#166534" />
              <path d="M30,30 C55,45 70,80 62,110 C54,140 30,170 20,185 C45,160 62,125 65,95 C68,65 50,40 30,30 Z" fill="#15803d" />
            </svg>
          </div>
          
          {/* Top Panel (Timer badge, audio, exit) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative', marginBottom: '20px' }}>
            {/* Left: Timer Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#a7f3d0',
              borderRadius: '24px',
              padding: '6px 16px 6px 12px',
              border: '2px solid #34d399',
              boxShadow: '0 4px 10px rgba(52, 211, 153, 0.2)'
            }}>
              {/* Clock Icon SVG */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>Thời gian kiểm tra:</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>
                  {formatMatchTime(gameTime)} giây
                </span>
              </div>
            </div>
            
            {/* Right: Audio control and Exit button */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Sound Button */}
              <button
                onClick={() => setIsMuted(prev => !prev)}
                title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f97316',
                  border: '2px solid #ea580c',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s',
                  fontSize: '18px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              
              {/* Exit Button */}
              <button
                onClick={() => setIsMatchModeActive(false)}
                title="Thoát trò chơi"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '2px solid #dc2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s',
                  fontSize: '18px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                📴
              </button>
            </div>
          </div>
          
          {/* Main Board Container */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            {!isCompleted ? (
              /* CARD GRID */
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                padding: '24px',
                width: '100%',
                maxWidth: '900px',
                boxShadow: '0 20px 50px rgba(22, 163, 74, 0.08)',
                display: 'grid',
                gridTemplateColumns: matchGrid.length >= 12 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                {matchGrid.map((item) => {
                  const isSelected = selectedMatchItem?.id === item.id;
                  const isCorrect = correctPairIds.includes(item.id);
                  const isWrong = wrongPairIds.includes(item.id);
                  const isMatched = matchedItemIds.has(item.id);
                  
                  let cardClass = 'card-item';
                  if (isCorrect) cardClass += ' card-correct';
                  if (isWrong) cardClass += ' card-wrong';
                  
                  let borderStyle = '1px solid #e2e8f0';
                  let bgStyle = '#ffffff';
                  let shadowStyle = '0 4px 8px rgba(0, 0, 0, 0.02)';
                  
                  if (isSelected) {
                    borderStyle = '3px solid #3b82f6';
                    shadowStyle = '0 8px 16px rgba(59, 130, 246, 0.15)';
                  }
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMatchItemClick(item)}
                      className={cardClass}
                      style={{
                        height: '110px',
                        borderRadius: '16px',
                        border: borderStyle,
                        backgroundColor: bgStyle,
                        boxShadow: shadowStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: isMatched ? 'default' : 'pointer',
                        userSelect: 'none',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1e293b',
                        opacity: isMatched ? 0 : 1,
                        pointerEvents: isMatched ? 'none' : 'auto',
                        visibility: isMatched ? 'hidden' : 'visible'
                      }}
                    >
                      {item.text}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* GAME COMPLETED SUMMARY SCREEN */
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                border: '3px solid #4ade80'
              }}>
                <span style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#065f46', margin: '0 0 8px' }}>Tuyệt vời!</h3>
                <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px' }}>Bạn đã ghép đúng tất cả các thẻ!</p>
                
                {/* Score stats */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #bbf7d0',
                  borderRadius: '16px',
                  padding: '20px',
                  width: '100%',
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#166534', fontWeight: 600 }}>
                    <span>Thời gian thực hiện:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatMatchTime(gameTime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#166534', fontWeight: 600 }}>
                    <span>Số thẻ đã ghép:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800 }}>{matchGrid.length / 2} cặp</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                  <button
                    onClick={startMatchGame}
                    style={{
                      width: '100%',
                      backgroundColor: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(34, 197, 94, 0.2)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#16a34a' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#22c55e' }}
                  >
                    🔁 Chơi lại
                  </button>
                  <button
                    onClick={() => setIsMatchModeActive(false)}
                    style={{
                      width: '100%',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                  >
                    Thoát
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (isTestModeActive) {
    const isCompleted = testIndex >= testDeck.length && testDeck.length > 0;
    const currentCard = testDeck[testIndex];
    const formatMatchTime = (secs) => {
      const mm = Math.floor(secs / 60).toString().padStart(2, '0')
      const ss = (secs % 60).toString().padStart(2, '0')
      return `${mm} : ${ss}`
    }

    return (
      <section style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes option-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .option-wrong {
            animation: option-shake 0.4s ease-in-out;
            border-color: #f43f5e !important;
            background-color: #fff1f2 !important;
          }
          .option-correct {
            border-color: #10b981 !important;
            background-color: #ecfdf5 !important;
          }
          .option-card {
            transition: all 0.2s ease;
          }
          .option-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05) !important;
          }
        `}</style>

        {/* DESERT QUIZ THEME CONTAINER */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)',
          borderRadius: '24px',
          padding: '24px',
          minHeight: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          overflow: 'hidden',
          border: '2px solid #fdba74',
          boxShadow: '0 12px 40px rgba(249, 115, 22, 0.06)',
          flex: 1
        }}>
          {/* Desert Graphic Background */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', pointerEvents: 'none', zIndex: 1 }}>
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 1000 100" preserveAspectRatio="none">
              <path d="M0,100 L1000,100 L1000,40 C900,30 800,60 700,55 C600,50 500,20 400,35 C300,50 150,15 0,40 Z" fill="#ea580c" opacity="0.15" />
              <path d="M0,100 L1000,100 L1000,60 C920,50 820,80 750,75 C680,70 580,40 480,55 C380,70 200,30 0,65 Z" fill="#d97706" opacity="0.25" />
            </svg>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', right: '30px', bottom: '10px', width: '40px', height: '60px', opacity: 0.6 }}>
              <path d="M50,90 L50,10 M50,40 C40,40 30,50 30,60 L30,70 M50,30 C60,30 70,40 70,55 L70,65" stroke="#d97706" strokeWidth="8" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Top Panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, position: 'relative', marginBottom: '16px' }}>
            {!isCompleted && (
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#7c2d12' }}>
                Câu {testIndex + 1}/{testDeck.length}: Hãy chọn đáp án đúng
              </span>
            )}
            
            <button
              onClick={() => setIsTestModeActive(false)}
              title="Thoát kiểm tra"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: '1.5px solid #e2e8f0',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                fontSize: '16px',
                fontWeight: 'bold',
                marginLeft: 'auto'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#64748b' }}
            >
              ✕
            </button>
          </div>

          {/* Main Board Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 5, gap: '20px' }}>
            {!isCompleted ? (
              <>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  padding: '40px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px',
                  boxShadow: '0 8px 30px rgba(249, 115, 22, 0.08)',
                  border: '1px solid #ffedd5'
                }}>
                  <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: 0 }}>
                    {currentCard.frontContent}
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginTop: '10px'
                }}>
                  {testOptions.map((opt, idx) => {
                    const isSelected = testSelectedOption === opt;
                    const isRevealed = !!testSelectedOption;
                    
                    let borderStyle = '1.5px solid #e2e8f0';
                    let bgStyle = '#ffffff';
                    let colorStyle = '#334155';
                    let badgeBg = '#f1f5f9';
                    let badgeColor = '#64748b';
                    let optClass = 'option-card';
                    
                    if (isRevealed) {
                      if (opt.isCorrect) {
                        optClass += ' option-correct';
                        borderStyle = '2px solid #10b981';
                        bgStyle = '#ecfdf5';
                        colorStyle = '#065f46';
                        badgeBg = '#10b981';
                        badgeColor = '#ffffff';
                      } else if (isSelected && !opt.isCorrect) {
                        optClass += ' option-wrong';
                        borderStyle = '2px solid #f43f5e';
                        bgStyle = '#fff1f2';
                        colorStyle = '#9f1239';
                        badgeBg = '#f43f5e';
                        badgeColor = '#ffffff';
                      } else {
                        colorStyle = '#94a3b8';
                      }
                    }
                    
                    return (
                      <button
                        key={idx}
                        disabled={isRevealed}
                        onClick={() => {
                          setTestSelectedOption(opt);
                          if (opt.isCorrect) {
                            setTestScore(s => s + 1);
                          }
                          setTestShowCorrective(true);
                        }}
                        className={optClass}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px 20px',
                          borderRadius: '16px',
                          border: borderStyle,
                          backgroundColor: bgStyle,
                          color: colorStyle,
                          cursor: isRevealed ? 'default' : 'pointer',
                          fontSize: '15px',
                          fontWeight: 600,
                          textAlign: 'left',
                          width: '100%',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)'
                        }}
                      >
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ flex: 1 }}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '24px',
                padding: '40px',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                alignSelf: 'center',
                border: '3px solid #f97316'
              }}>
                <span style={{ fontSize: '64px', marginBottom: '16px' }}>📝</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#7c2d12', margin: '0 0 8px' }}>Kiểm tra hoàn tất!</h3>
                <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px' }}>Bạn đã trả lời xong tất cả các câu hỏi.</p>
                
                <div style={{
                  backgroundColor: '#fff7ed',
                  border: '2px solid #ffedd5',
                  borderRadius: '16px',
                  padding: '20px',
                  width: '100%',
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#7c2d12', fontWeight: 700 }}>
                    <span>Số câu đúng:</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#22c55e' }}>{testScore} / {testDeck.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#7c2d12', fontWeight: 700 }}>
                    <span>Tỷ lệ chính xác:</span>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round((testScore / testDeck.length) * 100)}%</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                  <button
                    onClick={() => {
                      const shuffledDeck = shuffleArray([...cards]).slice(0, Number(testWordCount));
                      setTestDeck(shuffledDeck);
                      setTestIndex(0);
                      setTestScore(0);
                      generateTestQuestion(0, shuffledDeck);
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#f97316',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ea580c' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f97316' }}
                  >
                    🔁 Làm lại bài kiểm tra
                  </button>
                  <button
                    onClick={() => setIsTestModeActive(false)}
                    style={{
                      width: '100%',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                  >
                    Thoát
                  </button>
                </div>
              </div>
            )}
          </div>

          {testShowCorrective && (() => {
            const isCorrect = testSelectedOption?.isCorrect;
            const correctOptText = testOptions.find(o => o.isCorrect)?.text || '';
            
            return (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                backgroundColor: isCorrect ? '#e0fdfa' : '#ffe4e6',
                border: isCorrect ? '2px solid #2dd4bf' : '2px solid #f43f5e',
                borderRadius: '20px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isCorrect ? '0 10px 25px rgba(45, 212, 191, 0.2)' : '0 10px 25px rgba(244, 63, 94, 0.2)',
                zIndex: 100,
                animation: 'slideUp 0.3s ease-out'
              }}>
                <style>{`
                  @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                  }
                `}</style>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {isCorrect ? (
                    <span style={{ fontSize: '36px' }}>🌸</span>
                  ) : (
                    <span style={{ fontSize: '36px', transform: 'scaleX(-1) rotate(10deg)' }}>😭</span>
                  )}
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: isCorrect ? '#0f766e' : '#e11d48', margin: '0 0 4px' }}>
                      {isCorrect ? 'Tặng bạn một bông hoa 🌸' : 'Đừng lo, bạn vẫn đang học mà!'}
                    </h4>
                    <div style={{ fontSize: '14px', color: isCorrect ? '#0d9488' : '#9f1239', fontWeight: 600 }}>
                      {isCorrect ? (
                        'Hãy tiếp tục phát huy nhé!'
                      ) : (
                        <>
                          Đáp án đúng: <span style={{ color: '#10b981', fontWeight: 800 }}>{correctOptText}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTestSelectedOption(null);
                    setTestShowCorrective(false);
                    if (testIndex < testDeck.length - 1) {
                      setTestIndex(i => i + 1);
                      generateTestQuestion(testIndex + 1, testDeck);
                    } else {
                      setTestIndex(testDeck.length);
                    }
                  }}
                  style={{
                    backgroundColor: isCorrect ? '#2dd4bf' : '#f43f5e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: isCorrect ? '0 4px 10px rgba(45, 212, 191, 0.2)' : '0 4px 10px rgba(244, 63, 94, 0.2)',
                    transition: 'background 0.2s',
                    marginLeft: '12px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isCorrect ? '#0d9488' : '#e11d48'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isCorrect ? '#2dd4bf' : '#f43f5e'}
                >
                  Tiếp tục
                </button>
              </div>
            );
          })()}
        </div>
      </section>
    );
  }

  // STANDARD CLEAN SLIDER MODE
  const sliderIndex = Math.min(index, cards.length > 0 ? cards.length - 1 : 0);
  const currentSliderCard = cards[sliderIndex] || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Flashcard Panel */}
      <div 
        style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)' 
        }}
      >
        {/* Header row: title + regenerate */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {set.setName || 'Flashcards'}
          </h2>
          <button
            onClick={onRegenerate}
            disabled={loading}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: loading ? '#e0e7ff' : '#6366f1', color: loading ? '#6366f1' : '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s' }}
          >
            <StudyHubIcon name="refresh" size={14} />
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>

        {/* 3D FLIP CONTAINER */}
        {cards.length > 0 ? (
          <div 
            onClick={() => setFlipped((value) => !value)}
            style={{ 
              perspective: '1000px', 
              height: '220px', 
              position: 'relative', 
              width: '100%',
              cursor: 'pointer'
            }}
          >
            {/* INNER WRAPPER */}
            <div 
              style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                transformStyle: 'preserve-3d', 
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
                transform: flipped ? 'rotateY(180deg)' : 'none'
              }}
            >
              {/* FRONT FACE */}
              <div 
                style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  top: 0, 
                  left: 0, 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  padding: '20px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#fff', 
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  zIndex: 2
                }}
              >
                <div style={{ position: 'absolute', top: '14px', left: '16px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Mặt trước</div>
                <div style={{ position: 'absolute', top: '14px', right: '16px', display: 'flex', gap: '12px', color: '#eab308' }}>
                  <button 
                    onClick={(e) => toggleStar(currentSliderCard.id, e)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: starredIds.has(currentSliderCard.id) ? '#eab308' : '#cbd5e1', fontSize: '16px' }}
                  >
                    ★
                  </button>
                  <span style={{ color: '#6366f1' }}><StudyHubIcon name="edit" size={16} /></span>
                </div>
                <div 
                  style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    width: '100%', 
                    display: 'block', 
                    textAlign: 'center', 
                    padding: '0 16px',
                  }}
                >
                  <h3 style={{ fontSize: getDynamicFontSize(currentSliderCard.frontContent, 18), fontWeight: 700, color: '#0f172a', textAlign: 'center', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                    {currentSliderCard.frontContent}
                  </h3>
                </div>
                <div style={{ position: 'absolute', bottom: '14px', fontSize: '12px', color: '#64748b' }}>Nhấp để lật thẻ</div>
              </div>

              {/* BACK FACE */}
              <div 
                style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  top: 0, 
                  left: 0, 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  padding: '20px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#fff', 
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                  transform: 'rotateY(180deg)',
                  zIndex: 1
                }}
              >
                <div style={{ position: 'absolute', top: '14px', left: '16px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Mặt sau</div>
                <div style={{ position: 'absolute', top: '14px', right: '16px', display: 'flex', gap: '12px', color: '#eab308' }}>
                  <button 
                    onClick={(e) => toggleStar(currentSliderCard.id, e)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: starredIds.has(currentSliderCard.id) ? '#eab308' : '#cbd5e1', fontSize: '16px' }}
                  >
                    ★
                  </button>
                  <span style={{ color: '#6366f1' }}><StudyHubIcon name="edit" size={16} /></span>
                </div>
                <div 
                  style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    width: '100%', 
                    display: 'block', 
                    textAlign: 'center', 
                    padding: '0 16px',
                  }}
                >
                  <h3 style={{ fontSize: getDynamicFontSize(currentSliderCard.backContent, 18), fontWeight: 700, color: '#0f172a', textAlign: 'center', margin: 0, wordBreak: 'break-word', lineHeight: 1.4 }}>
                    {currentSliderCard.backContent}
                  </h3>
                </div>
                <div style={{ position: 'absolute', bottom: '14px', fontSize: '12px', color: '#64748b' }}>Nhấp để lật thẻ</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '220px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '32px' }}>
            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, margin: 0 }}>Không có thẻ nào trong bộ bài này.</p>
          </div>
        )}
        
        {/* NAVIGATION BAR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          {/* Progress Bar */}
          {cards.length > 0 && (
            <div style={{ width: '280px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${((index + 1) / cards.length) * 100}%`, 
                  backgroundColor: '#6366f1', 
                  borderRadius: '3px',
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
          )}

          {/* Buttons & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              disabled={index === 0} 
              onClick={() => { setIndex((value) => value - 1); setFlipped(false) }} 
              type="button" 
              style={{ 
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: index === 0 ? '#f1f5f9' : '#6366f1',
                color: index === 0 ? '#cbd5e1' : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: index === 0 ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: index === 0 ? 'none' : '0 4px 10px rgba(99, 102, 241, 0.08)',
              }}
              onMouseEnter={(e) => {
                if (index !== 0) {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== 0) {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <StudyHubIcon name="arrow-left" size={14} />
            </button>

            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700, minWidth: '60px', textAlign: 'center' }}>
              {cards.length ? index + 1 : 0} / {cards.length}
            </span>

            <button 
              disabled={index >= cards.length - 1} 
              onClick={() => { setIndex((value) => value + 1); setFlipped(false) }} 
              type="button" 
              style={{ 
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: index >= cards.length - 1 ? '#f1f5f9' : '#6366f1',
                color: index >= cards.length - 1 ? '#cbd5e1' : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: index >= cards.length - 1 ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: index >= cards.length - 1 ? 'none' : '0 4px 10px rgba(99, 102, 241, 0.08)',
              }}
              onMouseEnter={(e) => {
                if (index < cards.length - 1) {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (index < cards.length - 1) {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <StudyHubIcon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Study Modes Panel */}
      <div 
        style={{ 
          backgroundColor: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)' 
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', marginTop: 0 }}>Chế độ học tập</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: Học từ mới */}
          <div 
            onClick={startLearnMode}
            style={{ 
              backgroundColor: '#eff6ff', 
              border: '2px solid #3b82f6', 
              borderRadius: '16px', 
              padding: '16px 20px', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '100px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.08)' }}
          >
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', tracking: '0.05em', backgroundColor: '#dbeafe', padding: '3px 6px', borderRadius: '10px' }}>Đang hoạt động</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a8a', marginTop: '6px', marginBottom: '4px' }}>Học từ mới</h4>
              <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0 }}>Ghi nhớ từ vựng với thẻ thông minh.</p>
            </div>
            <div style={{ alignSelf: 'flex-end', fontSize: '24px', marginTop: '4px' }}>📖</div>
          </div>

          {/* Card 2: Trò chơi ghép thẻ */}
          <div 
            onClick={startMatchGame}
            style={{ 
              backgroundColor: '#f0fdf4', 
              border: '2px solid #22c55e', 
              borderRadius: '16px', 
              padding: '16px 20px', 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              minHeight: '100px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.08)' }}
          >
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', tracking: '0.05em', backgroundColor: '#dcfce7', padding: '3px 6px', borderRadius: '10px' }}>Đang hoạt động</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#14532d', marginTop: '6px', marginBottom: '4px' }}>Trò chơi ghép thẻ</h4>
              <p style={{ fontSize: '12px', color: '#16a34a', margin: 0 }}>Ghép nghĩa và từ nhanh nhất có thể.</p>
            </div>
            <div style={{ alignSelf: 'flex-end', fontSize: '24px', marginTop: '4px' }}>🧩</div>
          </div>

        </div>
      </div>

      {showTestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowTestModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px' }}>Tùy chọn kiểm tra</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                Chọn số từ cần kiểm tra <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="number"
                min={1}
                max={cards.length}
                value={testWordCount}
                onChange={(e) => setTestWordCount(e.target.value)}
                placeholder={`Tối đa ${cards.length} từ`}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  color: '#0f172a',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <button
              onClick={() => {
                let count = parseInt(testWordCount);
                if (isNaN(count) || count <= 0) {
                  count = cards.length;
                }
                count = Math.min(count, cards.length);
                
                const shuffledDeck = shuffleArray([...cards]).slice(0, count);
                setTestDeck(shuffledDeck);
                setTestWordCount(count.toString());
                setTestIndex(0);
                setTestScore(0);
                setIsTestModeActive(true);
                setShowTestModal(false);
                generateTestQuestion(0, shuffledDeck);
              }}
              style={{
                width: '100%',
                backgroundColor: '#06b6d4',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891b2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06b6d4'}
            >
              BẮT ĐẦU KIỂM TRA
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function QuizPanel({ disabled, loading, onCreate, onOpen, quizzes }) {
  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Your Quizzes</h2>
        <button 
          disabled={disabled} 
          onClick={() => onCreate('MEDIUM')} 
          type="button"
          style={{ backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Generating...' : 'Create Quiz'}
        </button>
      </header>
      {quizzes.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quizzes.map((item) => (
            <div key={item.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '24px', backgroundColor: '#fdfdff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{item.quizTitle || `Quiz #${item.id}`}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => onOpen(item.id)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <StudyHubIcon name="refresh" size={14} /> Take Quiz
                  </button>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>0 attempts <StudyHubIcon name="chevron" size={12} style={{ transform: 'rotate(90deg)' }} /></span>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <StudyHubIcon name="more-vertical" size={16} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                {item.totalQuestions || 6} Topics: <span style={{ color: '#64748b', fontWeight: 400 }}>Record of Changes &bull; Table of Contents &bull; Overview &bull; System Functions &bull; <span style={{ color: '#6366f1', cursor: 'pointer' }}>Show 2 more topics</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: '#f5f3ff', padding: '32px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
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

  const questions = quiz.questions ?? []
  const question = questions[index]
  const options = question
    ? [['A', question.optionA], ['B', question.optionB], ['C', question.optionC], ['D', question.optionD]]
    : []
  const total = questions.length
  // Pagination: show 7 at a time
  const PAGE_SIZE = 7
  const pageStart = Math.floor(index / PAGE_SIZE) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, total)
  const pageNums = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i)

  const currentSelected = selectedAnswers[index] ?? ''
  const currentRevealed = !!currentSelected

  const move = (nextIndex) => {
    setIndex(nextIndex)
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
      textAlign: 'left', transition: 'all 0.15s', background: '#fff',
      width: '100%',
    }
    if (!currentRevealed) {
      return {
        ...base,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
        color: '#334155',
      }
    }
    if (key === question.correctOption) {
      return { ...base, borderColor: '#22c55e', backgroundColor: '#f0fdf4', color: '#15803d', boxShadow: '0 0 0 3px rgba(34,197,94,0.12)' }
    }
    if (currentSelected === key && key !== question.correctOption) {
      return { ...base, borderColor: '#ef4444', backgroundColor: '#fef2f2', color: '#b91c1c', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
    }
    return { ...base, borderColor: '#e2e8f0', color: '#94a3b8' }
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
            style={{ padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
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
              style={{ background: 'none', border: 'none', color: pageStart === 0 ? '#cbd5e1' : '#6366f1', cursor: pageStart === 0 ? 'default' : 'pointer', padding: '4px', fontSize: '16px', fontWeight: 700 }}
            >‹</button>

            {/* Page numbers */}
            {pageNums.map((n) => {
              const isCurrent = index === n
              const status = answers[n] // 'correct' | 'incorrect' | 'skipped'

              // Default styles
              let bg = '#f8fafc'
              let border = '1.5px solid #e2e8f0'
              let color = '#475569'
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
                  bg = '#fff'
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
              style={{ background: 'none', border: 'none', color: pageEnd >= total ? '#cbd5e1' : '#6366f1', cursor: pageEnd >= total ? 'default' : 'pointer', padding: '4px', fontSize: '16px', fontWeight: 700 }}
            >›</button>
          </div>

          <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Showing {pageStart + 1}–{pageEnd} of {total} questions
          </span>
        </div>

        {/* Balance Spacer */}
        <div />
      </div>

      {/* QUESTION CARD */}
      {question ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'auto' }}>
          {/* Progress label */}
          <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, marginBottom: '16px', margin: '0 0 16px', textAlign: 'center' }}>
            Question: {index + 1}/{total}
          </p>

          {/* Question text */}
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '32px', lineHeight: 1.5, margin: '0 0 32px', textAlign: 'center' }}>
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
                  backgroundColor: currentRevealed && key === question.correctOption ? '#22c55e'
                    : currentRevealed && currentSelected === key && key !== question.correctOption ? '#ef4444'
                    : '#f1f5f9',
                  color: (currentRevealed && key === question.correctOption) || (currentRevealed && currentSelected === key && key !== question.correctOption)
                    ? '#fff' : '#64748b',
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
            <div style={{
              padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
              backgroundColor: currentSelected === question.correctOption ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${currentSelected === question.correctOption ? '#86efac' : '#fca5a5'}`,
              color: currentSelected === question.correctOption ? '#15803d' : '#b91c1c',
              fontSize: '14px', fontWeight: 500, lineHeight: 1.6,
            }}>
              {currentSelected === question.correctOption
                ? '✓ Correct!'
                : `✗ Correct answer: ${question.correctOption}`}
              {question.explanation ? ` — ${question.explanation}` : ''}
            </div>
          )}

          {/* Actions: Previous | Skip | Next */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
            <button
              disabled={index === 0}
              onClick={() => move(index - 1)}
              type="button"
              style={{ padding: '10px 24px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: index === 0 ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '14px', cursor: index === 0 ? 'default' : 'pointer' }}
            >Previous</button>

            <button
              onClick={handleSkip}
              type="button"
              disabled={currentRevealed || index >= total - 1}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: (currentRevealed || index >= total - 1) ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '14px', cursor: (currentRevealed || index >= total - 1) ? 'default' : 'pointer' }}
            >Skip</button>

            <button
              disabled={index >= total - 1}
              onClick={() => move(index + 1)}
              type="button"
              style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: index >= total - 1 ? '#e0e7ff' : '#6366f1', color: index >= total - 1 ? '#a5b4fc' : '#fff', fontWeight: 600, fontSize: '14px', cursor: index >= total - 1 ? 'default' : 'pointer', transition: 'all 0.15s' }}
            >Next</button>
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

