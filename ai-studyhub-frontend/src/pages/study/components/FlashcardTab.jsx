import { useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'

function FlashcardViewer({ set, onRegenerate, loading }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [slideDirection, setSlideDirection] = useState('')
  const cards = set.cards ?? []
  const card = cards[index]

  // Reset index when set changes
  const [prevSetId, setPrevSetId] = useState(set.id)
  if (prevSetId !== set.id) {
    setPrevSetId(set.id)
    setIndex(0)
    setFlipped(false)
    setSlideDirection('')
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
          {set.setName || 'Flashcards'}
        </h2>
        <button
          onClick={onRegenerate}
          disabled={loading}
          type="button"
          className={`flex items-center gap-1.5 py-2 px-4 border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
            loading 
              ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400' 
              : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm'
          }`}
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <StudyHubIcon name="refresh" size={14} />
          )}
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      <div className={`flashcard-3d-container slide-${slideDirection}`} key={index}>
        <div 
          onClick={() => setFlipped((value) => !value)} 
          className={`flashcard-3d-inner ${flipped ? 'is-flipped' : ''}`}
        >
          {/* Front Face */}
          <div className="flashcard-3d-face flashcard-3d-front">
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px', fontWeight: 500 }}>Question</div>
            <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', maxWidth: '80%', margin: 0 }}>
              {card ? card.frontContent : 'No cards'}
            </h3>
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', bottom: '16px', fontSize: '12px' }}>Click to flip</div>
          </div>

          {/* Back Face */}
          <div className="flashcard-3d-face flashcard-3d-back">
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '12px', fontWeight: 500, zIndex: 1 }}>Answer</div>
            <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', maxWidth: '80%', margin: 0, zIndex: 1 }}>
              {card ? card.backContent : 'No cards'}
            </h3>
            <div className="text-slate-500 dark:text-slate-400" style={{ position: 'absolute', bottom: '16px', fontSize: '12px', zIndex: 1 }}>Click to flip</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flashcard-progress-container">
        <div 
          className="flashcard-progress-bar" 
          style={{ width: `${cards.length ? ((index + 1) / cards.length) * 100 : 0}%` }} 
        />
      </div>
      
      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '28px', marginTop: '16px' }}>
        <button 
          disabled={index === 0} 
          onClick={() => { setSlideDirection('prev'); setIndex((value) => value - 1); setFlipped(false) }} 
          type="button" 
          className="flashcard-nav-btn cursor-pointer"
          aria-label="Previous card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-1px)' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        
        <span className="flashcard-index-text">
          {cards.length ? index + 1 : 0} / {cards.length}
        </span>
        
        <button 
          disabled={index >= cards.length - 1} 
          onClick={() => { setSlideDirection('next'); setIndex((value) => value + 1); setFlipped(false) }} 
          type="button" 
          className="flashcard-nav-btn cursor-pointer"
          aria-label="Next card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(1px)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  )
}

export function FlashcardTab({ documentId, flashcardSet, onGenerateFlashcards, loading, initialAiLoading }) {
  if (flashcardSet) {
    return <FlashcardViewer set={flashcardSet} onRegenerate={onGenerateFlashcards} loading={loading} />
  }

  return (
    <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300" style={{ flex: 1, borderRadius: '16px', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, margin: 0 }}>
          <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 600 }}>AI</span> Flashcards
        </h2>
        <p className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ marginTop: '16px', fontSize: '15px', fontWeight: 500, textAlign: 'center' }}>
          Generate flashcards only when you need them for this document
        </p>
        <button
          onClick={onGenerateFlashcards}
          disabled={!documentId || loading || initialAiLoading}
          style={{ marginTop: '24px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
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
            <>
              <StudyHubIcon name="sparkles" size={16} />
              <span>Generate</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
