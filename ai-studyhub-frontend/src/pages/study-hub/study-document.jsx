import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { studyTabs } from '../../packages/mooc-data'

export function StudyDocumentPage({ activeTab, file, mode, onBack, onModeChange, onTabChange }) {
  const currentFile = file ?? {
    name: '漢字--JPD316 Lesson 5-NEW.pptx',
    attachmentName: 'BTVN-BAI_PART3.docx',
    content: '',
  }
  const [generatedTabs, setGeneratedTabs] = useState({ notes: false, summary: false })
  const [quizStage, setQuizStage] = useState('empty')

  useEffect(() => {
    setGeneratedTabs({ notes: false, summary: false })
    setQuizStage('empty')
  }, [currentFile.name, currentFile.attachmentName])

  const generateTab = (tab) => {
    setGeneratedTabs((currentTabs) => ({ ...currentTabs, [tab]: true }))
  }

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
        {activeTab === 'original' && <div className="study-doc-pill"><StudyHubIcon name="file" size={16} /> {currentFile.attachmentName || currentFile.name}</div>}
        {activeTab === 'original' && <OriginalContent file={currentFile} />}
        {activeTab === 'notes' && (generatedTabs.notes ? (
          <AiNotes file={currentFile} />
        ) : (
          <AiGeneratePrompt
            description="Generate detailed notes covering the important information in your original content"
            label="Notes"
            onGenerate={() => generateTab('notes')}
          />
        ))}
        {activeTab === 'summary' && (generatedTabs.summary ? (
          <AiSummary file={currentFile} />
        ) : (
          <AiGeneratePrompt
            description="Create a clear and easy-to-understand summary of your content"
            label="Summary"
            onGenerate={() => generateTab('summary')}
          />
        ))}
        {activeTab === 'flashcards' && (mode === 'manage' ?<ManageCards file={currentFile} /> : <Flashcards file={currentFile} onManage={() => onModeChange('manage')} />)}
        {activeTab === 'quizzes' && (mode === 'taking' ? (
          <QuizTaking
            file={currentFile}
            onQuit={() => {
              setQuizStage('empty')
              onModeChange('default')
            }}
          />
        ) : quizStage === 'create' ? (
          <CreateQuiz
            file={currentFile}
            onGenerate={() => {
              setQuizStage('taking')
              onModeChange('taking')
            }}
          />
        ) : (
          <QuizEmptyState onCreate={() => setQuizStage('create')} />
        ))}
      </main>
      <AiTutor />
    </div>
  )
}

function AiGeneratePrompt({ description, label, onGenerate }) {
  return (
    <section className="ai-generate-panel">
      <h2><span>AI</span> {label}</h2>
      <p>{description}</p>
      <button className="ai-generate-button" onClick={onGenerate} type="button">
        <StudyHubIcon name="sparkle" size={16} /> Generate
      </button>
    </section>
  )
}

function QuizEmptyState({ onCreate }) {
  return (
    <section className="quiz-empty-view">
      <header>
        <h2>Your Quizzes</h2>
        <button className="ai-generate-button" onClick={onCreate} type="button">Create Quiz</button>
      </header>
      <div className="quiz-empty-card">No quizzes found</div>
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

function AiSummary({ file }) {
  const keyLines = getKeyLines(file)

  if (file.content) {
    return (
      <section className="document-paper summary-paper">
        <h2>AI Summary</h2>
        <p>{file.name} has {file.content.split(/\s+/).filter(Boolean).length} words across {file.content.split(/\r?\n/).filter(Boolean).length} content lines.</p>
        <table>
          <thead><tr><th>Part</th><th>Detected content</th><th>Study use</th></tr></thead>
          <tbody>
            {keyLines.slice(0, 4).map((line, index) => (
              <tr key={line}><td>Point {index + 1}</td><td>{line}</td><td>Review and convert into notes, flashcards, or quiz prompts.</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    )
  }

  return (
    <section className="document-paper summary-paper">
      <table>
        <thead><tr><th>Term</th><th>Explanation</th><th>Example Detail</th></tr></thead>
        <tbody>
          <tr><td>交換 (Exchange)</td><td>Meeting people and exchanging information</td><td>Email address exchange at a social event</td></tr>
          <tr><td>定価 (List price)</td><td>Original price before discount</td><td>30% off making the item cheaper</td></tr>
          <tr><td>サイト (Website)</td><td>Recommended online platform</td><td>"jpss" for university information</td></tr>
          <tr><td>クーポン (Coupon)</td><td>Discount voucher to reduce costs</td><td>Drinks half price with coupon</td></tr>
        </tbody>
      </table>
      <h2>Section 2: Word Choice and Application</h2>
      <p>This exercise tests the ability to select words fitting different situations.</p>
      <ul>
        <li><strong>口コミ</strong> as a major factor in restaurant selection.</li>
        <li><strong>検索</strong> as an internet activity to find information.</li>
        <li><strong>安全</strong> warning regarding suspicious websites.</li>
      </ul>
    </section>
  )
}

function Flashcards({ file, onManage }) {
  const [firstTerm] = getTerms(file)

  return (
    <section className="flashcard-view">
      <div className="select-line"><select><option>Select topics...</option></select><button type="button">☷ More</button></div>
      <h2>{file.content ? file.name : '16課 ことばを知って楽しむ'}</h2>
      <article className="flashcard">
        <small>Question</small>
        <span>☆ ✎</span>
        <h3>Define {firstTerm}:</h3>
        <p>Click to flip</p>
      </article>
      <div className="flash-controls"><button>←</button><span>1 of 296</span><button>→</button></div>
      <div className="flash-actions">
        <button onClick={onManage} type="button"><StudyHubIcon name="card" size={16} /> Manage Cards</button>
        <button className="primary-action" type="button">Filter Topics</button>
        <button className="primary-action" type="button">Shuffle</button>
        <button type="button">Export</button>
      </div>
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

function CreateQuiz({ file, onGenerate }) {
  return (
    <section className="quiz-create document-paper">
      <h2>Create Quiz</h2>
      <label>Number of Questions<select><option>10 questions</option></select></label>
      <h3>Question Types</h3>
      <div className="quiz-types">{['Multiple Choice', 'Fill in the Blank', 'True/False'].map((item) => <button key={item}>☑ {item}</button>)}</div>
      <h3>Select Materials or Specific Topics</h3>
      <button className="material-row" type="button">☑ 📄 {file.attachmentName || file.name} ›</button>
      <button className="primary-action wide" onClick={onGenerate} type="button">Generate</button>
    </section>
  )
}

function QuizTaking({ file, onQuit }) {
  const [firstLine] = getKeyLines(file)

  return (
    <section className="quiz-taking">
      <div className="quiz-nav"><button onClick={onQuit} type="button">Quit</button>{[1, 2, 3, 4, 5, 6, 7].map((n) => <span className={n === 1 ? 'active' : ''} key={n}>{n}</span>)}</div>
      <small>Showing 1-7 of 10 questions</small>
      <article className="question-card">
        <p>Question: 1/10</p>
        <h2>{file.content ? `Summarize this idea: ${firstLine}` : 'I bought this clothing at' } <mark /> {!file.content && 'It was 30% off the regular price, so I was very happy.'}</h2>
        <input placeholder="Enter your answer" />
        <div><button disabled>Previous</button><button>Skip</button><button disabled>Submit</button></div>
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

function AiTutor() {
  return (
    <aside className="ai-tutor">
      <header><h2>AI Tutor</h2><button type="button">This Session</button></header>
      <TutorTile icon="card" title="Flashcards" text="Study with active recall" />
      <TutorTile icon="help" title="Quizzes" text="Test your knowledge" />
      <div className="orb" />
      <div className="question-box">
        <h3>Have a Question about your import?</h3>
        <p>You can ask questions about your imported content, and your answers will appear here</p>
        <div><button>Write a paragraph...</button><button>Explain concept...</button><button>Compare with...</button></div>
      </div>
      <div className="ai-input"><StudyHubIcon name="sparkle" size={16} /><input placeholder="Ask AI assistant..." /><button>➤</button></div>
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
