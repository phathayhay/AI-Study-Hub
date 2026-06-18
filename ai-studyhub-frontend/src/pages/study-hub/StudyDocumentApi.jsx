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

            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>

              {/* CONTENT AREA */}
              <div style={{ flex: 1, padding: activeTab === 'original' ? '0' : '24px', overflowY: activeTab === 'original' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
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
                flashcardSet
                  ? <FlashcardViewer set={flashcardSet} onRegenerate={regenerateFlashcards} loading={loading} />
                  : <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#6366f1', padding: '48px' }}>
                      <div style={{ width: '48px', height: '48px', border: '4px solid #e0e7ff', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569', margin: 0 }}>{loading ? 'Generating flashcards...' : 'Loading flashcards...'}</p>
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
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = set.cards ?? []
  const card = cards[index]

  // Reset to first card when set changes
  const prevSetId = useState(set.id)
  if (prevSetId[0] !== set.id) { prevSetId[1](set.id); setIndex(0); setFlipped(false) }

  return (
    <section>
      {/* Header row: title + regenerate */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {set.setName || 'Flashcards'}
        </h2>
        <button
          onClick={onRegenerate}
          disabled={loading}
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: loading ? '#e0e7ff' : '#6366f1', color: loading ? '#6366f1' : '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s' }}
        >
          <StudyHubIcon name="refresh" size={14} />
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      <article onClick={() => setFlipped((value) => !value)} style={{ border: '1px solid #6366f1', borderRadius: '12px', padding: '32px', minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)' }}>
        <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{flipped ? 'Answer' : 'Question'}</div>
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '12px', color: '#eab308' }}>
          <StudyHubIcon name="star" size={16} />
          <span style={{ color: '#6366f1' }}><StudyHubIcon name="edit" size={16} /></span>
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', textAlign: 'center', maxWidth: '80%' }}>{card ? flipped ? card.backContent : card.frontContent : 'No cards'}</h3>
        <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', color: '#64748b' }}>Click to flip</div>
      </article>
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginTop: '24px' }}>
        <button disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setFlipped(false) }} type="button" style={{ background: 'none', border: 'none', color: index === 0 ? '#cbd5e1' : '#6366f1', cursor: index === 0 ? 'default' : 'pointer' }}><StudyHubIcon name="arrow-left" size={20} /></button>
        <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>{cards.length ? index + 1 : 0} of {cards.length}</span>
        <button disabled={index >= cards.length - 1} onClick={() => { setIndex((value) => value + 1); setFlipped(false) }} type="button" style={{ background: 'none', border: 'none', color: index >= cards.length - 1 ? '#cbd5e1' : '#6366f1', cursor: index >= cards.length - 1 ? 'default' : 'pointer' }}><StudyHubIcon name="arrow-right" size={20} /></button>
      </div>
    </section>
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

