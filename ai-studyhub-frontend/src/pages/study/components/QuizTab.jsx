import { useEffect, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'

function QuizPanel({ disabled, loading, onCreate, onOpen, quizzes }) {
  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Your Quizzes</h2>
        <button 
          disabled={disabled || loading} 
          onClick={() => onCreate('MEDIUM')} 
          type="button"
          style={{ backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            'Create Quiz'
          )}
        </button>
      </header>
      {quizzes.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quizzes.map((item) => (
            <div key={item.id} className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300 shadow-sm" style={{ borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{item.quizTitle || `Quiz #${item.id}`}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => onOpen(item.id)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-355 transition-colors cursor-pointer" style={{ background: 'none', border: 'none', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StudyHubIcon name="refresh" size={14} /> Take Quiz
                  </button>
                  <span className="text-slate-800 dark:text-slate-200 transition-colors" style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>0 attempts <StudyHubIcon name="chevron" size={12} style={{ transform: 'rotate(90deg)' }} /></span>
                  <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <StudyHubIcon name="more-vertical" size={16} />
                  </button>
                </div>
              </div>
              <div className="text-slate-800 dark:text-slate-200" style={{ fontSize: '13px', fontWeight: 600 }}>
                {item.totalQuestions || 6} Topics: <span className="text-slate-500 dark:text-slate-400 font-normal">Record of Changes &bull; Table of Contents &bull; Overview &bull; System Functions &bull; <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer" style={{ fontWeight: 500 }}>Show 2 more topics</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ padding: '32px', borderRadius: '12px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
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
  const [showResults, setShowResults] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [slideDirection, setSlideDirection] = useState('')

  const questions = quiz.questions ?? []
  const question = questions[index]
  const options = question
    ? [['A', question.optionA], ['B', question.optionB], ['C', question.optionC], ['D', question.optionD]]
    : []

  const encouragements = [
    "Don't worry, you're still learning!",
    "That's okay, mistakes help you grow!",
    "Keep going, you can get the next one!",
    "One wrong answer means one more thing to remember. Keep it up!",
    "Stay confident, learning is a journey!",
    "No worries, you're making progress every day!"
  ]

  const correctEncouragements = [
    "Excellent work! You did really well.",
    "Correct! Great job on that one.",
    "Awesome! Keep up the great work!",
    "Nicely done! You studied this carefully.",
    "That's right! You're doing great.",
    "Spot on! Keep the momentum going!"
  ]
  const total = questions.length
  const PAGE_SIZE = 7
  const pageStart = Math.floor(index / PAGE_SIZE) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, total)
  const pageNums = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i)

  const currentSelected = selectedAnswers[index] ?? ''
  const currentRevealed = !!currentSelected

  const move = (nextIndex) => {
    if (nextIndex > index) {
      setSlideDirection('next')
    } else if (nextIndex < index) {
      setSlideDirection('prev')
    }
    setIndex(nextIndex)
  }

  const correctCount = Object.values(answers).filter(val => val === 'correct').length
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0

  useEffect(() => {
    if (!showResults) return

    const timer = setTimeout(() => {
      setAnimatedScore(scorePercent)
    }, 150)
    return () => clearTimeout(timer)
  }, [showResults, scorePercent])

  if (showResults) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '440px', padding: '16px', textAlign: 'center' }}>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 quiz-results-card" style={{ width: '100%', maxWidth: '440px', borderRadius: '24px', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
          
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '22px', fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
            Quiz Results
          </h2>

          {/* Circular score gauge */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="140" height="140" className="quiz-svg-ring">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  {scorePercent >= 80 ? (
                    <>
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </>
                  ) : scorePercent >= 50 ? (
                    <>
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </>
                  )}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" floodColor={scorePercent >= 80 ? "#10b981" : scorePercent >= 50 ? "#6366f1" : "#f43f5e"} />
                </filter>
              </defs>
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r="54"
                strokeWidth="10"
                className="stroke-slate-100 dark:stroke-slate-700"
                fill="transparent"
                style={{ stroke: 'var(--slider-track-color)' }}
              />
              {/* Progress Circle */}
              <circle
                cx="70"
                cy="70"
                r="54"
                strokeWidth="10"
                stroke="url(#scoreGrad)"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray="339.292"
                strokeDashoffset={339.292 - (339.292 * animatedScore) / 100}
                className="quiz-circle-progress"
                filter="url(#glow)"
              />
            </svg>
            <div className="bg-white dark:bg-slate-800" style={{
              position: 'absolute',
              width: '106px',
              height: '106px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
            }}>
              <span className="text-slate-900 dark:text-white" style={{ fontSize: '32px', fontWeight: 800 }}>
                {scorePercent}%
              </span>
              <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
                SCORE
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 className="text-slate-800 dark:text-slate-100" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {scorePercent >= 80 ? "Excellent! You did a great job." :
               scorePercent >= 50 ? "Nice work! Keep it going." :
               "Keep practicing and you'll do even better next time."}
            </h3>
            <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '14px', margin: 0, fontWeight: 500 }}>
              You answered <strong>{correctCount}</strong> out of <strong>{total}</strong> questions correctly.
            </p>
          </div>

          {/* Detailed stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
            <div className="quiz-stat-box is-correct">
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Correct
              </span>
              <strong style={{ fontSize: '20px', color: '#047857', marginTop: '4px' }} className="dark:text-emerald-400">{correctCount} / {total}</strong>
            </div>
            <div className="quiz-stat-box is-incorrect">
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Wrong / Skipped
              </span>
              <strong style={{ fontSize: '20px', color: '#b91c1c', marginTop: '4px' }} className="dark:text-rose-400">{total - correctCount} / {total}</strong>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '4px' }}>
            <button
              onClick={() => {
                setIndex(0)
                setAnswers({})
                setSelectedAnswers({})
                setShowResults(false)
                setAnimatedScore(0)
              }}
              type="button"
              className="quiz-btn-secondary cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Retry
            </button>
            <button
              onClick={onBack}
              type="button"
              className={`quiz-btn-primary cursor-pointer ${
                scorePercent >= 80 ? 'quiz-theme-green' :
                scorePercent >= 50 ? 'quiz-theme-indigo' :
                'quiz-theme-rose'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Done
            </button>
          </div>

        </div>
      </section>
    )
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
      textAlign: 'left', transition: 'all 0.15s', background: 'var(--quiz-opt-bg)',
      width: '100%',
    }
    if (!currentRevealed) {
      return {
        ...base,
        borderColor: 'var(--quiz-opt-border)',
        color: 'var(--quiz-opt-color)',
      }
    }
    if (key === question.correctOption) {
      return { ...base, borderColor: 'var(--quiz-opt-correct-border)', backgroundColor: 'var(--quiz-opt-correct-bg)', color: 'var(--quiz-opt-correct-color)', boxShadow: '0 0 0 3px rgba(34,197,94,0.12)' }
    }
    if (currentSelected === key && key !== question.correctOption) {
      return { ...base, borderColor: 'var(--quiz-opt-incorrect-border)', backgroundColor: 'var(--quiz-opt-incorrect-bg)', color: 'var(--quiz-opt-incorrect-color)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' }
    }
    return { ...base, borderColor: 'var(--quiz-opt-border)', color: '#94a3b8' }
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
            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold transition-colors duration-250 cursor-pointer"
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px' }}
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
              className="text-indigo-600 dark:text-indigo-400 disabled:text-slate-300 dark:disabled:text-slate-700 font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', padding: '4px', fontSize: '16px' }}
            >‹</button>

            {/* Page numbers */}
            {pageNums.map((n) => {
              const isCurrent = index === n
              const status = answers[n]

              let bg = 'var(--quiz-num-bg)'
              let border = '1.5px solid var(--quiz-num-border)'
              let color = 'var(--quiz-num-color)'
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
                  bg = 'var(--quiz-num-active-bg)'
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
              className="text-indigo-600 dark:text-indigo-400 disabled:text-slate-300 dark:disabled:text-slate-700 font-bold cursor-pointer"
              style={{ background: 'none', border: 'none', padding: '4px', fontSize: '16px' }}
            >›</button>
          </div>

          <span className="text-slate-400 dark:text-slate-500" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
            Showing {pageStart + 1}–{pageEnd} of {total} questions
          </span>
        </div>

        <div />
      </div>

      {/* QUESTION CARD */}
      {question ? (
        <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300 quiz-card-container slide-${slideDirection}`} key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', padding: '32px', overflow: 'auto' }}>
          <p className="text-slate-400 dark:text-slate-500 font-medium" style={{ fontSize: '13px', marginBottom: '16px', margin: '0 0 16px', textAlign: 'center' }}>
            Question: {index + 1}/{total}
          </p>

          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '32px', lineHeight: 1.5, margin: '0 0 32px', textAlign: 'center' }}>
            {question.questionText}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '32px' }}>
            {options.map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelectOption(key)}
                type="button"
                style={getOptionStyle(key)}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  backgroundColor: currentRevealed && key === question.correctOption ? 'var(--quiz-opt-correct-border)'
                    : currentRevealed && currentSelected === key && key !== question.correctOption ? 'var(--quiz-opt-incorrect-border)'
                    : 'var(--quiz-num-bg)',
                  color: (currentRevealed && key === question.correctOption) || (currentRevealed && currentSelected === key && key !== question.correctOption)
                    ? '#fff' : 'var(--quiz-num-color)',
                  transition: 'all 0.15s',
                }}>
                  {key}
                </span>
                {value}
              </button>
            ))}
          </div>

          {currentRevealed && (
            currentSelected === question.correctOption ? (
              <div 
                className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-teal-900 dark:text-teal-300 transition-colors"
                style={{
                  padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>🎉</span>
                  <strong style={{ fontSize: '15px', color: '#0d9488' }}>
                    {correctEncouragements[index % correctEncouragements.length]}
                  </strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }} className="text-teal-700 dark:text-teal-400">
                  Keep up the great work!
                </div>
              </div>
            ) : (
              <div 
                className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 transition-colors"
                style={{
                  padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>💡</span>
                  <strong style={{ fontSize: '15px', color: '#e11d48' }}>
                    {encouragements[index % encouragements.length]}
                  </strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#4c0519' }} className="dark:text-rose-200">
                  Đáp án đúng: <span style={{ fontWeight: 700 }}>{question.correctOption}. {
                    question.correctOption === 'A' ? question.optionA :
                    question.correctOption === 'B' ? question.optionB :
                    question.correctOption === 'C' ? question.optionC :
                    question.optionD
                  }</span>
                </div>
                {question.explanation && (
                  <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.85 }}>
                    Giải thích: {question.explanation}
                  </div>
                )}
              </div>
            )
          )}

          {/* Actions: Previous | Skip | Next */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
            <button
              disabled={index === 0}
              onClick={() => move(index - 1)}
              type="button"
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-700 font-semibold transition-colors cursor-pointer"
              style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px' }}
            >Previous</button>

            <button
              onClick={handleSkip}
              type="button"
              disabled={currentRevealed || index >= total - 1}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-700 font-semibold transition-colors cursor-pointer"
              style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px' }}
            >Skip</button>

            {index >= total - 1 ? (
              <button
                onClick={() => setShowResults(true)}
                type="button"
                className="font-semibold transition-colors border-none cursor-pointer"
                style={{ padding: '10px 28px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontSize: '14px' }}
              >Complete</button>
            ) : (
              <button
                disabled={index >= total - 1}
                onClick={() => move(index + 1)}
                type="button"
                className="font-semibold transition-colors border-none cursor-pointer"
                style={{ padding: '10px 28px', borderRadius: '8px', background: index >= total - 1 ? 'var(--quiz-num-border)' : '#6366f1', color: index >= total - 1 ? 'var(--quiz-num-color)' : '#fff', fontSize: '14px' }}
              >Next</button>
            )}
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

export function QuizTab({ documentId, quiz, quizzes, loading, onCreateQuiz, onOpenQuiz, setQuiz, quotaReached = false }) {
  if (quiz) {
    return <QuizViewer quiz={quiz} onBack={() => setQuiz(null)} />
  }

  return (
    <QuizPanel 
      disabled={!documentId || loading}
      loading={loading} 
      onCreate={onCreateQuiz} 
      onOpen={onOpenQuiz} 
      quizzes={quizzes} 
    />
  )
}
