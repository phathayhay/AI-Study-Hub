import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { studyTabs } from '../../data/studyHubData'
import { generateSummary, generateQuiz, generateFlashcards, getDocumentQuizzes, getDocumentFlashcardSets } from '../../features/ai/aiService'

export function StudyDocumentPage({ activeTab, file, mode, onBack, onModeChange, onTabChange }) {
  const currentFile = file ?? {
    name: '漢字--JPD316 Lesson 5-NEW.pptx',
    attachmentName: 'BTVN-BAI_PART3.docx',
    content: '',
  }
  const docId = file?.id || file?.documentId || 1
  const [summaryData, setSummaryData] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [flashcardData, setFlashcardData] = useState(null)
  const [flashcardLoading, setFlashcardLoading] = useState(false)
  const [quizData, setQuizData] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizList, setQuizList] = useState(null)
  const [error, setError] = useState('')

  const doGenerateSummary = async () => {
    setSummaryLoading(true)
    setError('')
    try {
      const res = await generateSummary(docId)
      setSummaryData(res.data || res)
    } catch (err) {
      setError(err?.message || 'Tạo summary thất bại')
    } finally { setSummaryLoading(false) }
  }

  const doGenerateFlashcards = async () => {
    setFlashcardLoading(true)
    setError('')
    try {
      const res = await generateFlashcards(docId)
      setFlashcardData(res.data || res)
    } catch (err) {
      setError(err?.message || 'Tạo flashcard thất bại')
    } finally { setFlashcardLoading(false) }
  }

  const doGenerateQuiz = async () => {
    setQuizLoading(true)
    setError('')
    try {
      const res = await generateQuiz(docId)
      setQuizData(res.data || res)
    } catch (err) {
      setError(err?.message || 'Tạo quiz thất bại')
    } finally { setQuizLoading(false) }
  }

  const loadQuizList = async () => {
    try {
      const res = await getDocumentQuizzes(docId)
      setQuizList(Array.isArray(res) ? res : res?.data || [])
    } catch { setQuizList([]) }
  }

  useEffect(() => {
    if (activeTab === 'quizzes') loadQuizList()
  }, [activeTab, docId])

  return (
    <div className="study-shell">
      <main className="study-main">
        <div className="study-header">
          <button className="back-pill study-back-button" onClick={onBack} type="button">
            <span className="back-pill__icon"><StudyHubIcon name="arrow-left" size={16} /></span>
            <span>Trở lại</span>
          </button>
          <span>›</span>
          <strong>{currentFile.name}</strong>
          <StudyHubIcon name="file" size={14} />
        </div>
        <nav className="study-tabs">
          {studyTabs.map((tab) => (
            <button className={activeTab === tab.id ? 'is-active' : ''} key={tab.id} onClick={() => onTabChange(tab.id)} type="button">
              <StudyHubIcon name={tab.icon} size={15} /> {tab.label}
            </button>
          ))}
        </nav>
        {error && <p className="auth-error" style={{ margin: '0 24px' }}>{error}</p>}
        {activeTab === 'original' && <div className="study-doc-pill"><StudyHubIcon name="file" size={16} /> {currentFile.attachmentName || currentFile.name}</div>}
        {activeTab === 'original' && <OriginalContent file={currentFile} />}
        {activeTab === 'notes' && <AiNotes file={currentFile} />}
        {activeTab === 'summary' && (summaryData ? (
          <AiSummary data={summaryData} />
        ) : (
          <AiGeneratePrompt
            description="Create a clear and easy-to-understand summary of your content"
            label="Summary"
            loading={summaryLoading}
            onGenerate={doGenerateSummary}
          />
        ))}
        {activeTab === 'flashcards' && (mode === 'manage' ? <ManageCards file={currentFile} /> : flashcardData ? (
          <FlashcardViewer data={flashcardData} onBack={() => setFlashcardData(null)} />
        ) : (
          <Flashcards file={currentFile} loading={flashcardLoading} onGenerate={doGenerateFlashcards} onManage={() => onModeChange('manage')} />
        ))}
        {activeTab === 'quizzes' && (quizData ? (
          <QuizTaking data={quizData} onBack={() => { setQuizData(null); onModeChange('default') }} />
        ) : quizLoading ? (
          <section className="document-paper" style={{ padding: 24, textAlign: 'center' }}><p>Đang tạo quiz...</p></section>
        ) : (
          <QuizList quizzes={quizList} onCreate={doGenerateQuiz} />
        ))}
      </main>
      <AiTutor docId={docId} />
    </div>
  )
}

function AiGeneratePrompt({ description, label, onGenerate, loading }) {
  return (
    <section className="ai-generate-panel">
      <h2><span>AI</span> {label}</h2>
      <p>{description}</p>
      <button className="ai-generate-button" onClick={onGenerate} type="button" disabled={loading}>
        {loading ? 'Đang xử lý...' : <><StudyHubIcon name="sparkle" size={16} /> Generate</>}
      </button>
    </section>
  )
}

function QuizList({ quizzes, onCreate }) {
  return (
    <section className="quiz-empty-view">
      <header>
        <h2>Your Quizzes</h2>
        <button className="ai-generate-button" onClick={onCreate} type="button">Create Quiz</button>
      </header>
      {Array.isArray(quizzes) && quizzes.length > 0 ? quizzes.map((q) => (
        <div className="quiz-empty-card" key={q.id} style={{ marginTop: 8, cursor: 'default' }}>
          <strong>{q.quizTitle}</strong> — {q.totalQuestions} questions — {q.difficultyLevel}
        </div>
      )) : <div className="quiz-empty-card">No quizzes found</div>}
    </section>
  )
}

function OriginalContent({ file }) {
  if (file.content) {
    return (
      <section className="document-paper original-paper uploaded-paper">
        <h2>{file.name}</h2>
        {file.sizeLabel && <small>{file.sizeLabel}</small>}
        <pre>{file.content}</pre>
      </section>
    )
  }

  if (file.name !== '漢字--JPD316 Lesson 5-NEW.pptx') {
    return (
      <section className="document-paper original-paper uploaded-paper">
        <h2>{file.name}</h2>
        {file.sizeLabel && <small>{file.sizeLabel}</small>}
        <p>{file.readStatus || 'File đã được import vào AI Study Session.'}</p>
        <p>Frontend hiện tại chưa có parser cho PDF/DOCX/PPTX, nên nội dung text cần được xử lý bởi backend trước khi hiển thị đầy đủ.</p>
      </section>
    )
  }

  return (
    <section className="document-paper original-paper">
      <h2>Yarunara Taikai - Giáo trình Project</h2>
      <small>2018.4.10</small>
      <h3>Dekiru Nihongo Shokyu - Bai 1.3 - Bai tap</h3>
      <p>[1] Chon tu thich hop dien vao cho trong.</p>
      <div className="choice-row">{['mae wa', 'jibun', 'kondo', 'tomodachi', 'zenbu'].map((item) => <button key={item}>{item}</button>)}</div>
      <p>1. Hikkoshi no ( <a>ganbaru</a> ) wa taihen deshita.</p>
      <p>2. Rai shu wa isogashii desu. ( <a>minna san</a> ) ni kimasu.</p>
      <p>[2] Chon dong tu dung va viet vao cho trong.</p>
      <div className="choice-row">{['wasureru', 'taberu', 'otosu', 'kieru'].map((item) => <button key={item}>{item}</button>)}</div>
    </section>
  )
}

function AiNotes({ file }) {
  const keyLines = getKeyLines(file)

  if (file.content) {
    return (
      <section className="notes-view">
        <div className="editor-toolbar">↶ ↷ H1 H2 B I U S</div>
        <h1><span>AI</span> Notes</h1>
        <article className="document-paper">
          <h2>Notes from {file.name}</h2>
          <p>AI extracted these study points from the uploaded file:</p>
          <ul>
            {keyLines.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </article>
      </section>
    )
  }

  return (
    <section className="notes-view">
      <div className="editor-toolbar">↶ ↷ H1 H2 B I U S 🔗 🖼</div>
      <h1><span>AI</span> Notes</h1>
      <article className="document-paper">
        <h2>Vocabulary Practice</h2>
        <p>1. Choose the appropriate word to fill in the blanks:</p>
        <ul>
          <li>交流会で知り合った人とメール（交換）を交換しました。</li>
          <li>この服は（定価）で買いました。定価から30%引きだったので、とても安かったです。</li>
          <li>インターネットで大学を調べるなら、「jpss」という（サイト）がおすすめです。</li>
          <li>この（クーポン）を持って行くと、飲み物の値段が半額になります。</li>
        </ul>
      </article>
    </section>
  )
}

function AiSummary({ data }) {
  if (!data) return <section className="document-paper summary-paper" style={{ padding: 24 }}><p>Chưa có dữ liệu summary.</p></section>
  return (
    <section className="document-paper summary-paper">
      <h2>AI Summary</h2>
      {data.shortSummary && <p><strong>Tóm tắt ngắn:</strong> {data.shortSummary}</p>}
      {data.longSummary && <div><h3>Tóm tắt chi tiết</h3><p>{data.longSummary}</p></div>}
      {Array.isArray(data.keyTakeaways) && data.keyTakeaways.length > 0 && (
        <>
          <h3>Key Takeaways</h3>
          <ul>{data.keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}</ul>
        </>
      )}
    </section>
  )
}

function Flashcards({ file, onManage, onGenerate, loading }) {
  return (
    <section className="flashcard-view">
      <div className="select-line"><select><option>Select topics...</option></select><button type="button">☷ More</button></div>
      <h2>{file?.name || 'Flashcards'}</h2>
      <article className="flashcard" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <p>Nhấn Generate để tạo flashcard từ nội dung</p>
      </article>
      <div className="flash-actions">
        <button className="primary-action" onClick={onGenerate} type="button" disabled={loading}>
          {loading ? 'Đang tạo...' : <><StudyHubIcon name="sparkle" size={16} /> Generate Flashcards</>}
        </button>
        <button onClick={onManage} type="button"><StudyHubIcon name="card" size={16} /> Manage Cards</button>
      </div>
    </section>
  )
}

function FlashcardViewer({ data, onBack }) {
  const cards = data?.cards || []
  const [idx, setIdx] = useState(0)
  const card = cards[idx]
  return (
    <section className="flashcard-view">
      <div className="select-line"><button onClick={onBack} type="button">← Back</button></div>
      <h2>{data?.setName || 'Flashcards'}</h2>
      {card ? (
        <>
          <article className="flashcard">
            <small>Front</small><h3>{card.frontContent}</h3>
            <hr />
            <small>Back</small><p>{card.backContent}</p>
          </article>
          <div className="flash-controls">
            <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} type="button">←</button>
            <span>{idx + 1} of {cards.length}</span>
            <button disabled={idx >= cards.length - 1} onClick={() => setIdx(idx + 1)} type="button">→</button>
          </div>
        </>
      ) : <p style={{ padding: 24, textAlign: 'center' }}>Không có card nào.</p>}
    </section>
  )
}

function ManageCards({ file }) {
  const terms = getTerms(file)
  const cards = file.content ? terms.slice(0, 2).map((term) => [file.name, `What does "${term}" mean?`, 'Generated from uploaded content.']) : [
    ['13課 ことば', 'What does "国際交流" mean?', 'It means international exchange.'],
    ['20課 ことば', 'Define "進歩".', 'It means progress or advancement.'],
  ]

  return (
    <section className="manage-cards">
      <div className="manage-header"><h1>← Manage Cards</h1><button type="button">+ Add Card</button></div>
      <div className="select-line"><select><option>Select topics...</option></select><button type="button">☷ More</button></div>
      {cards.map(([tag, term, definition], index) => (
        <article className="card-editor" key={tag}>
          <p>Card {index + 1} ⭐ <Badge tone="purple">{tag}</Badge></p>
          <label>Term<input defaultValue={term} /></label>
          <label>Definition<input defaultValue={definition} /></label>
        </article>
      ))}
    </section>
  )
}

function QuizTaking({ data, onBack }) {
  const questions = data?.questions || []
  const [qIdx, setQIdx] = useState(0)
  const q = questions[qIdx]

  if (!q) return <section className="document-paper" style={{ padding: 24, textAlign: 'center' }}><p>Không có câu hỏi nào.</p></section>

  return (
    <section className="quiz-taking">
      <div className="quiz-nav">
        <button onClick={onBack} type="button">Quit</button>
        {questions.map((_, i) => <span className={i === qIdx ? 'active' : ''} key={i}>{i + 1}</span>)}
      </div>
      <small>{qIdx + 1} of {questions.length} questions</small>
      <article className="question-card">
        <p>Question: {qIdx + 1}/{questions.length}</p>
        <h2>{q.questionText}</h2>
        {['A', 'B', 'C', 'D'].filter((k) => q[`option${k}`]).map((k) => (
          <label key={k} style={{ display: 'block', margin: '8px 0' }}>
            <input type="radio" name={`q-${q.id}`} value={k} /> {k}. {q[`option${k}`]}
          </label>
        ))}
      </article>
    </section>
  )
}

function getKeyLines(file) {
  if (!file.content) return ['Vocabulary practice', 'Word choice in context', 'Review imported material']

  const lines = file.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (lines.length ? lines : [file.content]).slice(0, 6)
}

function getTerms(file) {
  if (!file.content) return ['市場', '交流', '進歩']

  const terms = Array.from(new Set(
    file.content
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3)
  ))

  return terms.length ? terms.slice(0, 6) : [file.name]
}

function AiTutor({ docId }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim()) return
    const q = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await generateSummary(docId)
      const d = res.data || res
      const reply = d?.shortSummary || d?.longSummary || 'Đã tạo summary từ nội dung.'
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Không thể kết nối AI, vui lòng thử lại.' }])
    } finally { setLoading(false) }
  }

  return (
    <aside className="ai-tutor">
      <header><h2>AI Tutor</h2><button type="button">This Session</button></header>
      <TutorTile icon="card" title="Flashcards" text="Study with active recall" />
      <TutorTile icon="help" title="Quizzes" text="Test your knowledge" />
      <div className="orb" />
      <div className="question-box" style={{ maxHeight: 200, overflowY: 'auto' }}>
        {messages.length === 0 && <><h3>Have a Question about your import?</h3><p>Ask anything, AI will answer based on your content.</p></>}
        {messages.map((m, i) => <p key={i} style={{ fontSize: 13, margin: '4px 0', color: m.role === 'user' ? '#2563eb' : '#374151' }}><strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.text}</p>)}
        {loading && <p style={{ fontSize: 13, color: '#9ca3af' }}>AI đang trả lời...</p>}
      </div>
      <div className="ai-input">
        <StudyHubIcon name="sparkle" size={16} />
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask AI assistant..." />
        <button onClick={send} disabled={loading}>➤</button>
      </div>
    </aside>
  )
}

function TutorTile({ icon, title, text }) {
  return (
    <div className="tutor-tile">
      <span><StudyHubIcon name={icon} size={20} /></span>
      <strong>{title} <Badge tone="purple">Popular</Badge></strong>
      <small>{text}</small>
    </div>
  )
}
