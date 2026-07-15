import { useEffect, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import Badge from '../ui/Badge'
import { getDocument, reportDocument } from '../../features/documents/documentService'

export function ReportModal({ onClose, documentId }) {
  const [doc, setDoc] = useState(null)
  const [reportType, setReportType] = useState('SPAM')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!documentId) return
    getDocument(documentId)
      .then(res => {
        setDoc(res?.data || res)
      })
      .catch(() => {
        setDoc({ id: documentId, title: 'Loading...', code: 'DOC' })
      })
  }, [documentId])

  const d = doc || { title: 'Loading...', code: 'DOC' }

  const handleSubmit = () => {
    if (!reason.trim()) {
      window.showToast?.('Please enter a reason for reporting', 'error')
      return
    }
    setLoading(true)
    reportDocument(documentId, reportType, reason.trim())
      .then(() => {
        window.showToast?.('Report submitted successfully', 'success')
        onClose()
      })
      .catch(err => {
        window.showToast?.(err.message || 'Failed to submit report', 'error')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-backdrop">
      <section className="report-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <StudyHubIcon name="flag" size={18} /> Report Document
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" type="button">×</button>
        </header>
        <div className="report-doc bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 transition-colors duration-300 ease-in-out" style={{ display: 'grid', gap: '8px', padding: '14px', borderRadius: '8px' }}>
          <Badge tone="blue">{d.code || d.id?.toString().slice(-6)}</Badge>
          <strong className="text-slate-800 dark:text-slate-200">{d.title}</strong>
        </div>

        <label className="text-slate-600 dark:text-slate-400 transition-colors duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          Violation Type *
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-450 transition-colors duration-200"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px' }}
          >
            <option value="SPAM">Spam / Junk</option>
            <option value="COPYRIGHT">Copyright Infringement</option>
            <option value="INAPPROPRIATE">Inappropriate Content</option>
            <option value="OTHER">Other Reason</option>
          </select>
        </label>

        <label className="text-slate-600 dark:text-slate-400 transition-colors duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          Detailed Description *
          <textarea
            placeholder="Please describe in detail the issue you encountered with this document..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-450 transition-colors duration-200"
            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', fontSize: '13.5px', resize: 'vertical' }}
          />
        </label>

        <div className="warning-box bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 transition-colors duration-300">Note: False reporting may lead to account suspension.</div>
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <button onClick={onClose} disabled={loading} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ minHeight: '40px', padding: '0 18px', background: 'transparent', borderRadius: '8px', cursor: 'pointer' }} type="button">Cancel</button>
          <button className="bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200" disabled={loading} onClick={handleSubmit} style={{ minHeight: '40px', padding: '0 18px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} type="button">
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </footer>
      </section>
    </div>
  )
}
