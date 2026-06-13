import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { studyTabs } from '../../packages/mooc-data'
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  getDocumentFlashcardSets,
  getDocumentQuizzes,
  getFlashcardSetDetails,
  getQuizDetails,
} from '../../features/ai/aiService'

export function StudyDocumentPage({ activeTab, file, onBack, onTabChange }) {
  const currentFile = file ?? { name: 'Tai lieu hoc tap', content: '' }
  const documentId = currentFile.documentId ?? currentFile.id
  const [notesGenerated, setNotesGenerated] = useState(false)
  const [summary, setSummary] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [flashcardSets, setFlashcardSets] = useState([])
  const [activeFlashcardSet, setActiveFlashcardSet] = useState(null)
  const [quizStage, setQuizStage] = useState('list')
  const [loadingAction, setLoadingAction] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    if (!documentId) {
      return () => {
        active = false
      }
    }

    Promise.all([
      getDocumentQuizzes(documentId),
      getDocumentFlashcardSets(documentId),
    ])
      .then(([quizData, flashcardData]) => {
        if (!active) return
        setQuizzes(quizData)
        setFlashcardSets(flashcardData)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })

    return () => {
      active = false
    }
  }, [documentId])

  const runAiAction = async (actionName, request) => {
    if (!documentId) {
      setError('Tai lieu nay chua co documentId tren backend.')
      return null
    }

    setLoadingAction(actionName)
    setError('')
    try {
      return await request()
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setLoadingAction('')
    }
  }

  const handleGenerateSummary = async () => {
    const result = await runAiAction('summary', () => generateSummary(documentId))
    if (result) setSummary(result)
  }

  const handleGenerateQuiz = async (difficulty) => {
    const result = await runAiAction('quiz', () => generateQuiz(documentId, difficulty))
    if (!result) return
    setQuizzes((current) => [result, ...current])
    setActiveQuiz(result)
    setQuizStage('taking')
  }

  const handleOpenQuiz = async (quizId) => {
    const result = await runAiAction('quiz-detail', () => getQuizDetails(quizId))
    if (!result) return
    setActiveQuiz(result)
    setQuizStage('taking')
  }

  const handleGenerateFlashcards = async () => {
    const result = await runAiAction('flashcards', () => generateFlashcards(documentId))
    if (!result) return
    setFlashcardSets((current) => [result, ...current])
    setActiveFlashcardSet(result)
  }

  const handleOpenFlashcards = async (setId) => {
    if (!setId) {
      setActiveFlashcardSet(null)
      return
    }
    const result = await runAiAction('flashcard-detail', () => getFlashcardSetDetails(setId))
    if (result) setActiveFlashcardSet(result)
  }

  return (
    <div className="study-shell">
      <main className="study-main">
        <div className="study-header">
          <button className="back-pill study-back-button" onClick={onBack} type="button">
            <span className="back-pill__icon"><StudyHubIcon name="arrow-left" size={16} /></span>
            <span>Tro lai</span>
          </button>
          <span>&gt;</span>
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

        {error && <p className="api-status api-status--error">{error}</p>}
        {loadingAction && <p className="api-status">AI dang xu ly, vui long cho...</p>}

        {activeTab === 'original' && <div className="study-doc-pill"><StudyHubIcon name="file" size={16} /> {currentFile.attachmentName || currentFile.name}</div>}
        {activeTab === 'original' && <OriginalContent file={currentFile} />}
        {activeTab === 'notes' && (notesGenerated
          ? <AiNotes file={currentFile} />
          : <AiGeneratePrompt description="Generate study notes from this document" label="Notes" onGenerate={() => setNotesGenerated(true)} />)}
        {activeTab === 'summary' && (summary
          ? <ApiSummary summary={summary} />
          : <AiGeneratePrompt description="Create a Vietnamese summary with key takeaways" label="Summary" onGenerate={handleGenerateSummary} />)}
        {activeTab === 'flashcards' && (
          <ApiFlashcards
            key={activeFlashcardSet?.id ?? 'flashcard-sets'}
            activeSet={activeFlashcardSet}
            loading={loadingAction === 'flashcards' || loadingAction === 'flashcard-detail'}
            onGenerate={handleGenerateFlashcards}
            onOpenSet={handleOpenFlashcards}
            sets={flashcardSets}
          />
        )}
        {activeTab === 'quizzes' && (
          quizStage === 'taking' && activeQuiz
            ? <ApiQuizTaking quiz={activeQuiz} onQuit={() => setQuizStage('list')} />
            : quizStage === 'create'
              ? <ApiCreateQuiz loading={loadingAction === 'quiz'} onGenerate={handleGenerateQuiz} />
              : <ApiQuizList quizzes={quizzes} onCreate={() => setQuizStage('create')} onOpen={handleOpenQuiz} />
        )}
      </main>
      <AiTutor />
    </div>
  )
}

function ApiSummary({ summary }) {
  return (
    <section className="document-paper summary-paper">
      <h2>AI Summary</h2>
      <p>{summary.shortSummary}</p>
      <h3>Tom tat chi tiet</h3>
      <p className="summary-long-text">{summary.longSummary}</p>
      <h3>Y chinh</h3>
      <ul>
        {(summary.keyTakeaways ?? []).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

function ApiFlashcards({ activeSet, loading, onGenerate, onOpenSet, sets }) {
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = activeSet?.cards ?? []
  const card = cards[cardIndex]

  if (!activeSet) {
    return (
      <section className="quiz-empty-view">
        <header>
          <h2>Your Flashcards</h2>
          <button className="ai-generate-button" disabled={loading} onClick={onGenerate} type="button">
            Generate Flashcards
          </button>
        </header>
        {sets.length ? (
          <div className="api-collection-list">
            {sets.map((set) => (
              <button key={set.id} onClick={() => onOpenSet(set.id)} type="button">
                <strong>{set.setName}</strong>
                <small>{set.totalCards} cards</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-empty-card">No flashcards found</div>
        )}
      </section>
    )
  }

  return (
    <section className="flashcard-view">
      <div className="manage-header">
        <button onClick={() => onOpenSet(null)} type="button">Flashcard sets</button>
        <h2>{activeSet.setName}</h2>
      </div>
      <button className="flashcard api-flashcard" onClick={() => setFlipped((current) => !current)} type="button">
        <small>{flipped ? 'Answer' : 'Question'}</small>
        <h3>{flipped ? card?.backContent : card?.frontContent}</h3>
        <p>Click to flip</p>
      </button>
      <div className="flash-controls">
        <button
          disabled={cardIndex === 0}
          onClick={() => {
            setCardIndex((current) => current - 1)
            setFlipped(false)
          }}
          type="button"
        >
          &lt;-
        </button>
        <span>{cards.length ? cardIndex + 1 : 0} of {cards.length}</span>
        <button
          disabled={cardIndex >= cards.length - 1}
          onClick={() => {
            setCardIndex((current) => current + 1)
            setFlipped(false)
          }}
          type="button"
        >
          -&gt;
        </button>
      </div>
    </section>
  )
}

function ApiQuizList({ onCreate, onOpen, quizzes }) {
  return (
    <section className="quiz-empty-view">
      <header>
        <h2>Your Quizzes</h2>
        <button className="ai-generate-button" onClick={onCreate} type="button">Create Quiz</button>
      </header>
      {quizzes.length ? (
        <div className="api-collection-list">
          {quizzes.map((quiz) => (
            <button key={quiz.id} onClick={() => onOpen(quiz.id)} type="button">
              <strong>{quiz.quizTitle}</strong>
              <small>{quiz.totalQuestions} questions - {quiz.difficultyLevel}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="quiz-empty-card">No quizzes found</div>
      )}
    </section>
  )
}

function ApiCreateQuiz({ loading, onGenerate }) {
  const [difficulty, setDifficulty] = useState('MEDIUM')

  return (
    <section className="quiz-create document-paper">
      <h2>Create Quiz</h2>
      <label>
        Difficulty
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </label>
      <p>Gemini will generate 5-10 multiple-choice questions from this document.</p>
      <button className="primary-action wide" disabled={loading} onClick={() => onGenerate(difficulty)} type="button">
        {loading ? 'Generating...' : 'Generate'}
      </button>
    </section>
  )
}

function ApiQuizTaking({ onQuit, quiz }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [revealed, setRevealed] = useState(false)
  const questions = quiz.questions ?? []
  const question = questions[questionIndex]
  const options = question ? [
    ['A', question.optionA],
    ['B', question.optionB],
    ['C', question.optionC],
    ['D', question.optionD],
  ] : []

  const goToQuestion = (nextIndex) => {
    setQuestionIndex(nextIndex)
    setSelectedOption('')
    setRevealed(false)
  }

  return (
    <section className="quiz-taking">
      <div className="quiz-nav">
        <button onClick={onQuit} type="button">Quit</button>
        <strong>{quiz.quizTitle}</strong>
      </div>
      {question ? (
        <article className="question-card">
          <p>Question {questionIndex + 1}/{questions.length}</p>
          <h2>{question.questionText}</h2>
          <div className="api-quiz-options">
            {options.map(([key, value]) => (
              <button
                className={selectedOption === key ? 'is-selected' : ''}
                key={key}
                onClick={() => {
                  setSelectedOption(key)
                  setRevealed(false)
                }}
                type="button"
              >
                <strong>{key}.</strong> {value}
              </button>
            ))}
          </div>
          {revealed && (
            <div className={selectedOption === question.correctOption ? 'quiz-result is-correct' : 'quiz-result is-wrong'}>
              <strong>{selectedOption === question.correctOption ? 'Correct' : `Correct answer: ${question.correctOption}`}</strong>
              <p>{question.explanation}</p>
            </div>
          )}
          <div>
            <button disabled={questionIndex === 0} onClick={() => goToQuestion(questionIndex - 1)} type="button">Previous</button>
            <button disabled={!selectedOption} onClick={() => setRevealed(true)} type="button">Check</button>
            <button disabled={questionIndex >= questions.length - 1} onClick={() => goToQuestion(questionIndex + 1)} type="button">Next</button>
          </div>
        </article>
      ) : (
        <div className="quiz-empty-card">Quiz has no questions</div>
      )}
    </section>
  )
}

export function LegacyStudyDocumentPage({ activeTab, file, mode, onBack, onModeChange, onTabChange }) {
  const currentFile = file ?? {
    name: '漢字--JPD316 Lesson 5-NEW.pptx',
    attachmentName: 'BTVN-BAI_PART3.docx',
    content: '',
  }
  const [generatedTabs, setGeneratedTabs] = useState({ notes: false, summary: false })
  const [quizStage, setQuizStage] = useState('empty')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
