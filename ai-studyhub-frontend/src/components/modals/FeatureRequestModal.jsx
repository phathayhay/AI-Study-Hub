import { useState } from 'react'

export function FeatureRequestModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTitle('')
      setDesc('')
    }, 800)
  }

  return (
    <div className="modal-backdrop">
      <section className="feedback-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1] dark:text-indigo-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <circle cx="6" cy="9" r="1" />
              <circle cx="6" cy="13" r="1" />
            </svg>
            Request New Feature
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">×</button>
        </header>

        <div className="settings-modal-content">
          {success ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-455 transition-colors duration-300" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <strong className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px' }}>Request Submitted Successfully!</strong>
              <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ margin: 0, fontSize: '14px', lineHeight: '20px' }}>
                Thank you for your valuable contribution. We will research this feature to improve AI Study Hub in the future.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Proposed Feature Name *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Online quiz mock exam feature" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Detailed Description *</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} placeholder="Please describe how this feature will work and its benefits..." className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          {success ? (
            <button onClick={onClose} className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none' }} type="button">Done</button>
          ) : (
            <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', fontWeight: 500 }} type="button">Cancel</button>
          )}
        </footer>
      </section>
    </div>
  )
}
