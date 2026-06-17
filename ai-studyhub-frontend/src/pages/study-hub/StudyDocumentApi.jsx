import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { studyTabs } from '../../data/studyHubData'
import AIChat from '../../features/ai/AIChat'
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  getDocumentFlashcardSets,
  getDocumentQuizzes,
  getDocumentSummary,
  getFlashcardSetDetails,
  getQuizDetails,
} from '../../features/ai/aiService'

export default function StudyDocumentApi({ activeTab, file, onBack, onTabChange }) {
  const documentId = file?.documentId ?? file?.id
  const [summary, setSummary] = useState(null)
  const [summaryChecked, setSummaryChecked] = useState(false)
  const [flashcardSets, setFlashcardSets] = useState([])
  const [flashcardSet, setFlashcardSet] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!documentId) {
      setSummary(null)
      setSummaryChecked(true)
      return undefined
    }
    let active = true
    setSummary(null)
    setSummaryChecked(false)

    getDocumentSummary(documentId)
      .then((summaryData) => {
        if (!active) return
        setSummary(summaryData || null)
      })
      .catch((requestError) => {
        if (!active) return
        if (![204, 404, 405, 500].includes(requestError.status)) console.warn(requestError)
      })
      .finally(() => {
        if (active) setSummaryChecked(true)
      })

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
        if (!active) return
        setError(requestError.message)
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
    if (result) {
      setSummary(result)
      setSummaryChecked(true)
    }
  }

  const handleFlashcards = async () => {
    const result = await runRequest(() => generateFlashcards(documentId))
    if (!result) return
    setFlashcardSet(result)
    setFlashcardSets((current) => [result, ...current.filter((item) => item.id !== result.id)])
  }

  const openFlashcards = async (setId) => {
    const result = await runRequest(() => getFlashcardSetDetails(setId))
    if (result) setFlashcardSet(result)
  }

  const handleQuiz = async (difficulty) => {
    const result = await runRequest(() => generateQuiz(documentId, difficulty))
    if (!result) return
    setQuiz(result)
    setQuizzes((current) => [result, ...current.filter((item) => item.id !== result.id)])
  }

  const openQuiz = async (quizId) => {
    const result = await runRequest(() => getQuizDetails(quizId))
    if (result) setQuiz(result)
  }

  return (
    <div className="study-shell">
      <main className="study-main">
        <div className="study-header">
          <button className="back-pill study-back-button" onClick={onBack} type="button">
            <StudyHubIcon name="arrow-left" size={16} /> Trở lại
          </button>
          <span>›</span>
          <strong>{file?.name || 'Tài liệu'}</strong>
        </div>
        <nav className="study-tabs">
          {studyTabs.map((tab) => (
            <button className={activeTab === tab.id ? 'is-active' : ''} key={tab.id} onClick={() => onTabChange(tab.id)} type="button">
              <StudyHubIcon name={tab.icon} size={15} /> {tab.label}
            </button>
          ))}
        </nav>

        {!documentId && <p className="api-status api-status--error">Tài liệu này chưa có documentId từ backend.</p>}
        {error && <p className="api-status api-status--error">{error}</p>}
        {activeTab === 'original' && <OriginalDocument file={file} />}
        {activeTab === 'summary' && (
          !summaryChecked
            ? <p className="api-status">Đang kiểm tra AI Summary...</p>
            : summary
            ? <SummaryView summary={summary} />
            : <GeneratePanel disabled={!documentId || loading} label="Summary" loading={loading} onGenerate={handleSummary} />
        )}
        {activeTab === 'flashcards' && (
          flashcardSet
            ? <FlashcardViewer onBack={() => setFlashcardSet(null)} set={flashcardSet} />
            : (
              <CollectionPanel
                buttonLabel="Generate Flashcards"
                disabled={!documentId || loading}
                emptyLabel="No flashcard sets found"
                items={flashcardSets}
                loading={loading}
                onCreate={handleFlashcards}
                onOpen={openFlashcards}
                title="Your Flashcards"
                type="flashcard"
              />
            )
        )}
        {activeTab === 'quizzes' && (
          quiz
            ? <QuizViewer onBack={() => setQuiz(null)} quiz={quiz} />
            : <QuizPanel disabled={!documentId || loading} loading={loading} onCreate={handleQuiz} onOpen={openQuiz} quizzes={quizzes} />
        )}
      </main>
      <AIChat documentId={documentId} documentTitle={file?.name || file?.attachmentName || 'Document'} />
    </div>
  )
}

function OriginalDocument({ file }) {
  const documentName = file?.name || file?.attachmentName || 'Untitled document'
  const attachmentName = file?.attachmentName && file.attachmentName !== documentName ? file.attachmentName : ''

  return (
    <section className="original-content-panel">
      <div className="original-file-icon">
        <StudyHubIcon name="file" size={30} />
      </div>
      <div className="original-file-info">
        <span className="original-file-kicker">Original Content</span>
        <h2>{documentName}</h2>
        <div className="original-file-meta">
          {file?.sizeLabel && <span>{file.sizeLabel}</span>}
          {file?.subject && <span>{file.subject}</span>}
          {attachmentName && <span>{attachmentName}</span>}
        </div>
      </div>
      {file?.fileUrl ? (
        <a className="original-open-button" href={file.fileUrl} rel="noreferrer" target="_blank">
          <StudyHubIcon name="eye" size={16} />
          Mở file gốc
        </a>
      ) : (
        <span className="original-file-empty">Không có URL file từ backend.</span>
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
    <section className="document-paper summary-paper">
      <h2>AI Summary</h2>
      <p><strong>Short summary</strong></p>
      <p>{summary.shortSummary}</p>
      <p><strong>Detailed summary</strong></p>
      <p>{summary.longSummary}</p>
      {!!summary.keyTakeaways?.length && (
        <>
          <h3>Key takeaways</h3>
          <ul>{summary.keyTakeaways.map((item) => <li key={item}>{item}</li>)}</ul>
        </>
      )}
    </section>
  )
}

function CollectionPanel({ buttonLabel, disabled, emptyLabel, items, loading, onCreate, onOpen, title, type }) {
  return (
    <section className="quiz-empty-view">
      <header>
        <h2>{title}</h2>
        <button className="ai-generate-button" disabled={disabled} onClick={onCreate} type="button">
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
      ) : <div className="quiz-empty-card">{emptyLabel}</div>}
    </section>
  )
}

function FlashcardViewer({ onBack, set }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = set.cards ?? []
  const card = cards[index]
  return (
    <section className="flashcard-view">
      <button className="text-link" onClick={onBack} type="button">← All flashcard sets</button>
      <h2>{set.setName}</h2>
      <article className="flashcard" onClick={() => setFlipped((value) => !value)}>
        <small>{flipped ? 'Answer' : 'Question'}</small>
        <h3>{card ? flipped ? card.backContent : card.frontContent : 'No cards'}</h3>
        <p>Click to flip</p>
      </article>
      <div className="flash-controls">
        <button disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setFlipped(false) }} type="button">←</button>
        <span>{cards.length ? index + 1 : 0} of {cards.length}</span>
        <button disabled={index >= cards.length - 1} onClick={() => { setIndex((value) => value + 1); setFlipped(false) }} type="button">→</button>
      </div>
    </section>
  )
}

function QuizPanel({ disabled, loading, onCreate, onOpen, quizzes }) {
  const [difficulty, setDifficulty] = useState('MEDIUM')
  return (
    <section className="quiz-panel">
      <header className="quiz-panel-header">
        <div>
          <span>Practice</span>
          <h2>Your Quizzes</h2>
        </div>
        <div className="quiz-panel-actions">
          <label className="quiz-difficulty-select">
            <span>Difficulty</span>
            <select onChange={(event) => setDifficulty(event.target.value)} value={difficulty}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <button className="ai-generate-button" disabled={disabled} onClick={() => onCreate(difficulty)} type="button">
            <StudyHubIcon name="plus" size={16} />
            {loading ? 'Generating...' : 'Create Quiz'}
          </button>
        </div>
      </header>
      {quizzes.length ? (
        <div className="quiz-list">
          {quizzes.map((item) => (
            <button className="quiz-list-card" key={item.id} onClick={() => onOpen(item.id)} type="button">
              <span className="quiz-list-icon"><StudyHubIcon name="help" size={20} /></span>
              <span className="quiz-list-title">
                <strong>{item.quizTitle}</strong>
                <small>{item.totalQuestions} questions</small>
              </span>
              <span className="quiz-difficulty-badge">{item.difficultyLevel}</span>
              <StudyHubIcon name="chevron" size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="quiz-empty-card">
          <StudyHubIcon name="help" size={24} />
          <strong>No quizzes found</strong>
          <span>Create one from this document to start practicing.</span>
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
