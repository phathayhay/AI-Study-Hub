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
  const [flashcardSets, setFlashcardSets] = useState([])
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
    Promise.all([
      getDocumentFlashcardSets(documentId),
      getDocumentQuizzes(documentId),
    ])
      .then(([sets, quizList]) => {
        if (!active) return
        setFlashcardSets(sets)
        setQuizzes(quizList)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => {
      active = false
    }
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
    if (result) setSummary(result)
  }

  const handleFlashcards = async () => {
    const result = await runRequest(() => generateFlashcards(documentId))
    if (!result) return
    setFlashcardSet(result)
    setFlashcardSets((current) => [result, ...current.filter((item) => item.id !== result.id)])
  }

  const openFlashcards = async (setId) => {
    const result = await runRequest(() => getFlashcardSet(setId))
    if (result) setFlashcardSet(result)
  }

  const handleQuiz = async (difficulty) => {
    const result = await runRequest(() => generateQuiz(documentId, difficulty))
    if (!result) return
    setQuiz(result)
    setQuizzes((current) => [result, ...current.filter((item) => item.id !== result.id)])
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
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 600, fontSize: '12px', marginBottom: '8px', backgroundColor: '#fff' }}>0</div>
            </div>

            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              {/* SUB-HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: '#64748b', cursor: 'pointer' }}>
                  <StudyHubIcon name="plus" size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  <StudyHubIcon name="file" size={14} />
                  {file?.name || 'Template2_SRD Document.docx'}
                </div>
              </div>

              {/* CONTENT AREA */}
              <div style={{ flex: 1, padding: activeTab === 'original' ? '0' : '24px', overflowY: activeTab === 'original' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
                {!documentId && <p className="api-status api-status--error">Tài liệu này chưa có documentId từ backend.</p>}
                {error && <p className="api-status api-status--error">{error}</p>}
                
                <div style={{ display: activeTab === 'original' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
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
              
              {activeTab === 'flashcards' && (flashcardSet ? <FlashcardViewer onBack={() => setFlashcardSet(null)} set={flashcardSet} /> : <CollectionPanel buttonLabel="Generate Flashcards" disabled={!documentId || loading} emptyLabel="No flashcard sets found" items={flashcardSets} loading={loading} onCreate={handleFlashcards} onOpen={openFlashcards} title="Your Flashcards" type="flashcard" />)}
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
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '130px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff', cursor: 'pointer' }}>
                      <div style={{ padding: '8px', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '8px', flexShrink: 0 }}><StudyHubIcon name="copy" size={16} /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Flash...</strong>
                          <span style={{ fontSize: '10px', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Popular</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>Study with active...</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '130px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff', cursor: 'pointer' }}>
                      <div style={{ padding: '8px', backgroundColor: '#fae8ff', color: '#d946ef', borderRadius: '8px', flexShrink: 0 }}><StudyHubIcon name="help" size={16} /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Quizz...</strong>
                          <span style={{ fontSize: '10px', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Popular</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>Test your knowle...</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #d946ef, #3b82f6)', margin: '0 auto 32px', boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)', animation: 'pulse 3s infinite alternate', flexShrink: 0 }} />
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

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fdfdff', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
        <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: '#6366f1', cursor: 'pointer' }}>
          <StudyHubIcon name="plus" size={16} />
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
          <StudyHubIcon name="file" size={14} />
          {documentName}
        </div>
      </div>

      {file?.fileUrl ? (
        <div className="document-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(file.fileUrl)}&embedded=true`}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Document Preview"
            style={{ flex: 1, backgroundColor: '#f1f5f9', border: 'none' }}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
          Không có URL file từ backend để xem trước.
        </div>
      )}
    </section>
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

function SummaryView({ summary }) {
  return (
    <section>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#818cf8', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '32px' }}>
        <StudyHubIcon name="file" size={14} />
        Template2_SRD Document.docx
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>AI</span> Summary
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6366f1' }}>
           <span style={{ fontSize: '12px', fontWeight: 600 }}>A</span>
           <div style={{ width: '48px', height: '4px', backgroundColor: '#e0e7ff', borderRadius: '2px', position: 'relative' }}><div style={{ width: '20px', height: '12px', backgroundColor: '#6366f1', borderRadius: '6px', position: 'absolute', top: '-4px', left: '14px' }}></div></div>
           <span style={{ fontSize: '18px', fontWeight: 600 }}>A</span>
           <span style={{ cursor: 'pointer' }}><StudyHubIcon name="volume" size={20} /></span>
           <span style={{ cursor: 'pointer' }}><StudyHubIcon name="download" size={20} /></span>
        </div>
      </div>
      
      <article style={{ border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#fff', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#475569', marginBottom: '24px' }}>Software Requirement Document Summary</h3>
        <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>I. Overview</h4>
        <div style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Short Summary</p>
          <p style={{ marginBottom: '16px' }}>{summary.shortSummary}</p>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>Detailed Summary</p>
          <p style={{ marginBottom: '16px' }}>{summary.longSummary}</p>
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

function FlashcardViewer({ onBack, set }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = set.cards ?? []
  const card = cards[index]
  return (
    <section>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#818cf8', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '32px' }}>
        <StudyHubIcon name="file" size={14} />
        Template2_SRD Document.docx
      </div>
      
      <div style={{ position: 'relative', marginBottom: '32px', textAlign: 'center' }}>
        <button onClick={onBack} type="button" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500 }}>
          <StudyHubIcon name="arrow-left" size={16} /> Back
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Overview</h2>
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
          onClick={onCreate} 
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
  const [selected, setSelected] = useState('')
  const [revealed, setRevealed] = useState(false)
  const questions = quiz.questions ?? []
  const question = questions[index]
  const options = question
    ? [['A', question.optionA], ['B', question.optionB], ['C', question.optionC], ['D', question.optionD]]
    : []

  const move = (nextIndex) => {
    setIndex(nextIndex)
    setSelected('')
    setRevealed(false)
  }

  return (
    <section className="quiz-taking">
      <div className="quiz-nav">
        <button className="text-link" onClick={onBack} type="button">Quit</button>
        <div>
          <strong>{quiz.quizTitle}</strong>
          <span>{questions.length} questions</span>
        </div>
      </div>
      {question ? (
        <article className="question-card">
          <p className="question-progress">Question {index + 1} of {questions.length}</p>
          <h2>{question.questionText}</h2>
          <div className="quiz-types">
            {options.map(([key, value]) => (
              <button className={selected === key ? 'is-active' : ''} key={key} onClick={() => { setSelected(key); setRevealed(false) }} type="button">
                <span>{key}</span>
                {value}
              </button>
            ))}
          </div>
          {revealed && (
            <p className={selected === question.correctOption ? 'quiz-result is-correct' : 'quiz-result'}>
              {selected === question.correctOption ? 'Correct' : `Correct answer: ${question.correctOption}`} - {question.explanation}
            </p>
          )}
          <div className="quiz-answer-actions">
            <button disabled={index === 0} onClick={() => move(index - 1)} type="button">Previous</button>
            <button disabled={!selected} onClick={() => setRevealed(true)} type="button">Check</button>
            <button disabled={index >= questions.length - 1} onClick={() => move(index + 1)} type="button">Next</button>
          </div>
        </article>
      ) : <div className="quiz-empty-card">Quiz has no questions</div>}
    </section>
  )
}
