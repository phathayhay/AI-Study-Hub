import { useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import { InfoBlock } from '../../pages/study-hub/shared'

export function FilePreviewModal({ file, onClose, onView }) {
  const [opening, setOpening] = useState(false)

  const handleView = () => {
    if (opening) return
    setOpening(true)
    onView()
  }

  return (
    <div className="modal-backdrop">
      <section className="file-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300">{file.name}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" type="button">×</button>
        </header>
        <div className="file-preview-hero bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 border border-purple-100/50 dark:border-slate-700 transition-colors duration-300 ease-in-out">
          <StudyHubIcon name="file" size={82} className="text-indigo-500 dark:text-indigo-400" />
          <p className="text-slate-800 dark:text-slate-200 font-medium transition-colors duration-300">{file.kind} Document</p>
          <small className="text-slate-500 dark:text-slate-400 transition-colors duration-300">{file.category ?? file.subject}</small>
        </div>
        <InfoBlock label="Document Name" value={file.name} />
        <InfoBlock label="Type" value={file.kind} />
        <InfoBlock label="Category" value={file.category ?? file.subject} />
        <InfoBlock label="Upload Date" value={file.date} />
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <button disabled={opening} onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ minHeight: '40px', padding: '0 18px', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }} type="button">Close</button>
          <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" disabled={opening} onClick={handleView} style={{ minHeight: '40px', padding: '0 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} type="button">
            <StudyHubIcon name="eye" size={16} /> {opening ? 'Opening...' : 'View Full Document'}
          </button>
        </footer>
      </section>
    </div>
  )
}
