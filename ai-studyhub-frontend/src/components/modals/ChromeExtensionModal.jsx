export function ChromeExtensionModal({ onClose }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '#'
    link.setAttribute('download', 'ai-studyhub-extension.zip')
    document.body.appendChild(link)
    window.showToast?.('AI Study Hub Extension Beta is downloading...', 'info')
    document.body.removeChild(link)
  }

  return (
    <div className="modal-backdrop">
      <section className="extension-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1] dark:text-indigo-400">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="8" x2="20.75" y2="8" />
              <line x1="12" y1="16" x2="3.25" y2="16" />
              <line x1="10" y1="10" x2="5.5" y2="18.5" />
            </svg>
            Chrome Extension Beta
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">×</button>
        </header>

        <div className="settings-modal-content" style={{ gap: '14px' }}>
          <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ margin: 0, fontSize: '14px', lineHeight: '20px' }}>
            AI Study Hub Chrome Extension helps you analyze, summarize, and ask questions about any document or website directly while browsing and studying on Chrome.
          </p>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '12px' }}>
            <span className="text-slate-800 dark:text-white font-semibold transition-colors duration-300" style={{ fontSize: '14px' }}>Extension Installation Guide:</span>
            <ol className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Click the <strong>Download Extension (Beta)</strong> button below to download the <code>ai-studyhub-extension.zip</code> file.</li>
              <li>Extract the downloaded zip file into a folder on your computer.</li>
              <li>Open Google Chrome and navigate to: <code>chrome://extensions/</code></li>
              <li>Enable Developer mode (<strong>Developer mode</strong>) in the top-right corner of Chrome.</li>
              <li>Click the <strong>Load unpacked</strong> button in the top-left corner, then select the folder you extracted in step 2.</li>
            </ol>
          </div>

          <button onClick={handleDownload} className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '8px', width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Extension (Beta)
          </button>
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', fontWeight: 500 }} type="button">Close</button>
        </footer>
      </section>
    </div>
  )
}
