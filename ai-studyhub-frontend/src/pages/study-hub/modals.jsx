import { useState, useEffect } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { featuredDocuments, notifications } from '../../data/studyHubData'
import { InfoBlock } from './shared'
import { changePassword } from '../../features/auth/authService'
import { uploadAvatar, verifyStudent } from '../../services/userService'
import { getDocument, reportDocument } from '../../features/documents/documentService'

export function NotificationPanel({ onClose }) {
  return (
    <aside className="notification-panel">
      <header>
        <h2><StudyHubIcon name="bell" size={22} /> Notifications <span>3</span></h2>
        <button type="button">✓ Mark all read</button>
        <button onClick={onClose} type="button"><StudyHubIcon name="close" size={18} /></button>
      </header>
      <nav>{['All', 'Unread', 'Documents', 'Interactions'].map((item, index) => <button className={index === 0 ? 'is-active' : ''} key={item}>{item}<small>{index ? index + 1 : ''}</small></button>)}</nav>
      {notifications.map((item) => (
        <article className={`notice-item notice-item--${item.type}`} key={item.id}>
          <span><StudyHubIcon name={item.icon} size={22} /></span>
          <div><h3>{item.title}</h3><p>{item.text}</p><strong>{item.author}</strong> <small>{item.time}</small></div>
        </article>
      ))}
      <button className="all-notifications" type="button">See all notifications ›</button>
    </aside>
  )
}

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

export function SettingsModal({ onClose, user, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Password state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Verification state (simulating or checking local state)
  const [verificationFile, setVerificationFile] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState(() => {
    return localStorage.getItem('verificationStatus') || 'unverified' // unverified, pending, verified
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadAvatar(formData)
      if (res?.success && res?.data) {
        const updatedUser = { ...user, avatarUrl: res.data }
        onUserUpdate(updatedUser)
        setSuccessMsg('Profile picture uploaded successfully!')
      } else {
        setErrorMsg('Unable to upload profile picture.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading profile picture.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.')
      return
    }

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await changePassword({ oldPassword, newPassword, confirmPassword })
      setSuccessMsg('Password changed successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect current password.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e) => {
    e.preventDefault()
    if (!verificationFile) {
      setErrorMsg('Please select your student ID Card image to upload.')
      return
    }

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', verificationFile)
      await verifyStudent(formData)
      setVerificationStatus('pending')
      localStorage.setItem('verificationStatus', 'pending')
      setSuccessMsg('Verification request submitted successfully! Please wait for admin approval.')
      setVerificationFile(null)
    } catch (err) {
      setErrorMsg(err.message || 'Unable to submit verification request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="settings-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StudyHubIcon name="settings" size={20} /> Account Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">×</button>
        </header>

        <nav className="settings-modal-tabs bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Profile</button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => { setActiveTab('password'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Security</button>
          <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => { setActiveTab('verification'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Verification</button>
        </nav>

        <div className="settings-modal-content">
          {successMsg && <div className="modal-alert success">{successMsg}</div>}
          {errorMsg && <div className="modal-alert error">{errorMsg}</div>}

          {activeTab === 'profile' && (
            <>
              <div className="avatar-upload-container bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <img
                  src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"}
                  alt="Avatar"
                  className="avatar-upload-preview"
                />
                <div className="avatar-upload-btn-container">
                  <label className="avatar-upload-btn bg-[#6366f1] hover:bg-indigo-700 transition-colors duration-250">
                    Change Avatar
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={loading} />
                  </label>
                  <span className="avatar-upload-info text-slate-400 dark:text-slate-500">Supports JPG, PNG max 5MB.</span>
                </div>
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">Họ và tên đệm</label>
                  <input value={user?.lastName || ''} readOnly className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" style={{ outline: 'none' }} />
                </div>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">Tên</label>
                  <input value={user?.firstName || ''} readOnly className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" style={{ outline: 'none' }} />
                </div>
              </div>

              <div className="settings-input-group" style={{ marginTop: '16px' }}>
                <label className="text-slate-600 dark:text-slate-400">Email đăng ký</label>
                <input value={user?.email || ''} readOnly className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" style={{ outline: 'none' }} />
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Current Password *</label>
                <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={loading} placeholder="Enter current password" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">New Password *</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} placeholder="At least 6 characters" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Confirm New Password *</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} placeholder="Enter new password again" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                {loading ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          )}

          {activeTab === 'verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px' }}>
                <span className="text-slate-800 dark:text-slate-200" style={{ fontSize: '14px', fontWeight: 500 }}>Verification Status:</span>
                {verificationStatus === 'verified' && <span className="settings-status-badge verified">Verified</span>}
                {verificationStatus === 'pending' && <span className="settings-status-badge pending">Pending</span>}
                {verificationStatus === 'unverified' && <span className="settings-status-badge unverified">Unverified</span>}
              </div>

              {verificationStatus === 'unverified' && (
                <form onSubmit={handleVerificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="settings-input-group">
                    <label className="text-slate-600 dark:text-slate-400">Upload Student ID Card image (Front) *</label>
                    <div className="avatar-upload-container bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                      <div className="avatar-upload-btn-container" style={{ flex: 1 }}>
                        <input type="file" accept="image/*" onChange={(e) => setVerificationFile(e.target.files[0])} disabled={loading} required className="text-slate-700 dark:text-slate-300" />
                        <span className="avatar-upload-info" style={{ marginTop: '4px' }}>
                          {verificationFile ? `Selected: ${verificationFile.name}` : 'Please select your student ID Card image.'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                    {loading ? 'Submitting...' : 'Submit Verification Request'}
                  </button>
                </form>
              )}

              {verificationStatus === 'pending' && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontSize: '13px', lineHeight: '18px' }} className="dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 transition-colors duration-300">
                  Your verification request has been submitted successfully. Admin will review and approve your student ID card within the next 24-48 hours.
                </div>
              )}

              {verificationStatus === 'verified' && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', lineHeight: '18px', display: 'flex', alignItems: 'center', gap: '8px' }} className="dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-450 transition-colors duration-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Your account has been verified as an official student.
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Close</button>
        </footer>
      </section>
    </div>
  )
}

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
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-450 transition-colors duration-300" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          {success ? (
            <button onClick={onClose} className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none' }} type="button">Done</button>
          ) : (
            <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Cancel</button>
          )}
        </footer>
      </section>
    </div>
  )
}

export function SupportModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [desc, setDesc] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setEmail('')
      setDesc('')
    }, 800)
  }

  return (
    <div className="modal-backdrop">
      <section className="support-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out">
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1] dark:text-indigo-400">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            Support Center
          </h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">×</button>
        </header>

        <div className="settings-modal-content">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-250 transition-colors duration-300" style={{ padding: '12px', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Official Channels:</strong></div>
            <div>📧 Email: support@aistudyhub.vn</div>
            <div>📞 Hotline: 1900 8198 (8:00 AM - 10:00 PM)</div>
          </div>

          {success ? (
            <div style={{ padding: '12px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 transition-colors duration-300" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <strong className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px' }}>Submitted Successfully!</strong>
              <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ margin: 0, fontSize: '14px', lineHeight: '20px' }}>
                Your support ticket has been received. Our technical team will reach back to you via email as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Contact Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email for our response" className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Describe the issue you need help with *</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} placeholder="e.g. I cannot download documents despite having paid..." className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" />
              </div>
              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                {loading ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          {success ? (
            <button onClick={onClose} className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none' }} type="button">Done</button>
          ) : (
            <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Cancel</button>
          )}
        </footer>
      </section>
    </div>
  )
}

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

          <button onClick={handleDownload} className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '8px', width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Extension (Beta)
          </button>
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '12px' }}>
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Close</button>
        </footer>
      </section>
    </div>
  )
}
