import { useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'

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
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '24px', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 600 }}>AI</span> Summary
        </h2>

        {/* Controls: A — slider — A  +  download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Small A */}
          <span
            onClick={() => setFontStep((s) => Math.max(0, s - 1))}
            className="text-indigo-600 dark:text-indigo-400"
            style={{ fontSize: '12px', fontWeight: 700, cursor: fontStep === 0 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1, opacity: fontStep === 0 ? 0.4 : 1 }}
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
                background: `linear-gradient(to right, #6366f1 ${(fontStep / (FONT_STEPS.length - 1)) * 100}%, var(--slider-track-color) ${(fontStep / (FONT_STEPS.length - 1)) * 100}%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Large A */}
          <span
            onClick={() => setFontStep((s) => Math.min(FONT_STEPS.length - 1, s + 1))}
            className="text-indigo-600 dark:text-indigo-400"
            style={{ fontSize: '18px', fontWeight: 700, cursor: fontStep === FONT_STEPS.length - 1 ? 'default' : 'pointer', userSelect: 'none', lineHeight: 1, opacity: fontStep === FONT_STEPS.length - 1 ? 0.4 : 1 }}
          >A</span>

          {/* Divider */}
          <div className="bg-slate-200 dark:bg-slate-700" style={{ width: '1px', height: '20px', margin: '0 4px' }} />

          {/* Download */}
          <button
            onClick={handleDownload}
            type="button"
            title="Download summary"
            className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors duration-150"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
          >
            <StudyHubIcon name="download" size={20} />
          </button>
        </div>
      </div>

      <article className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300" style={{ borderRadius: '16px', padding: '32px' }}>
        <div className="text-slate-700 dark:text-slate-300 transition-colors duration-150" style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}>
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

export function SummaryTab({ documentId, summary, onGenerateSummary, loading, initialAiLoading }) {
  if (summary) {
    return <SummaryView summary={summary} />
  }

  return (
    <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300" style={{ flex: 1, borderRadius: '16px', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center' }}>
        <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, margin: 0 }}>
          <span className="text-indigo-600 dark:text-indigo-400" style={{ fontWeight: 600 }}>AI</span> Summary
        </h2>
        <p className="text-slate-700 dark:text-slate-300 transition-colors duration-300" style={{ marginTop: '16px', fontSize: '15px', fontWeight: 500, textAlign: 'center' }}>
          Create a clear and easy-to-understand summary of your content
        </p>
        <button
          onClick={onGenerateSummary}
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
