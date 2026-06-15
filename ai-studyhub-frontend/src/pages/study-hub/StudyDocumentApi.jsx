import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { studyTabs } from '../../data/studyHubData'
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  getDocumentFlashcardSets,
  getDocumentQuizzes,
  getFlashcardSetDetails,
  getQuizDetails,
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
        {activeTab === 'notes' && (
          <section className="ai-generate-panel">
            <h2><span>AI</span> Notes</h2>
            <p>Backend hiện chưa cung cấp endpoint tạo hoặc lưu AI Notes.</p>
          </section>
        )}
        {activeTab === 'summary' && (
          summary
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
    </div>
  )
}

function OriginalDocument({ file }) {
  return (
    <>
      <div className="study-doc-pill"><StudyHubIcon name="file" size={16} /> {file?.attachmentName || file?.name}</div>
      <section className="document-paper original-paper uploaded-paper">
        <h2>{file?.name}</h2>
        {file?.sizeLabel && <small>{file.sizeLabel}</small>}
        {file?.fileUrl ? (
          <p><a href={file.fileUrl} rel="noreferrer" target="_blank">Mở file gốc</a></p>
        ) : (
          <p>Không có URL file từ backend.</p>
        )}
      </section>
    </>
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
    <section className="quiz-empty-view">
      <header>
        <h2>Your Quizzes</h2>
        <div>
          <select onChange={(event) => setDifficulty(event.target.value)} value={difficulty}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <button className="ai-generate-button" disabled={disabled} onClick={() => onCreate(difficulty)} type="button">
            {loading ? 'Generating...' : 'Create Quiz'}
          </button>
        </div>
      </header>
      {quizzes.length ? (
        <div className="file-list">
          {quizzes.map((item) => (
            <button className="file-row" key={item.id} onClick={() => onOpen(item.id)} type="button">
              <strong>{item.quizTitle}</strong>
              <small>{item.totalQuestions} questions · {item.difficultyLevel}</small>
            </button>
          ))}
        </div>
      ) : <div className="quiz-empty-card">No quizzes found</div>}
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
      <div className="quiz-nav"><button onClick={onBack} type="button">Quit</button><strong>{quiz.quizTitle}</strong></div>
      {question ? (
        <article className="question-card">
          <p>Question {index + 1}/{questions.length}</p>
          <h2>{question.questionText}</h2>
          <div className="quiz-types">
            {options.map(([key, value]) => (
              <button className={selected === key ? 'is-active' : ''} key={key} onClick={() => { setSelected(key); setRevealed(false) }} type="button">
                {key}. {value}
              </button>
            ))}
          </div>
          {revealed && <p>{selected === question.correctOption ? 'Correct' : `Correct answer: ${question.correctOption}`} · {question.explanation}</p>}
          <div>
            <button disabled={index === 0} onClick={() => move(index - 1)} type="button">Previous</button>
            <button disabled={!selected} onClick={() => setRevealed(true)} type="button">Check</button>
            <button disabled={index >= questions.length - 1} onClick={() => move(index + 1)} type="button">Next</button>
          </div>
        </article>
      ) : <div className="quiz-empty-card">Quiz has no questions</div>}
    </section>
  )
}
