import { useEffect, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import { changePassword } from '../../features/auth/authService'
import { uploadAvatar, verifyStudent, updateUserProfile } from '../../services/userService'
import { getMajors } from '../../services/courseService'

export function SettingsModal({ onClose, user, onUserUpdate, onNavigate, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [campus, setCampus] = useState(user?.campus || 'HCM')
  const [majorId, setMajorId] = useState(user?.majorId || '')
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || '')
  const [majorsList, setMajorsList] = useState([])
  const [verificationFile, setVerificationFile] = useState(null)
  const verificationRequestSubmitted = Boolean(user?.verificationRequestSubmitted)
  const [verificationStatus, setVerificationStatus] = useState(() => {
    const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
    const fromUser = user?.verificationStatus ? vsMap[user.verificationStatus] : null
    return fromUser || localStorage.getItem('verificationStatus') || 'unverified'
  })

  useEffect(() => {
    const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
    const fromUser = user?.verificationStatus ? vsMap[user.verificationStatus] : null
    if (fromUser) {
      setVerificationStatus(fromUser)
      localStorage.setItem('verificationStatus', fromUser)
    }
  }, [user?.verificationStatus])

  useEffect(() => {
    setActiveTab(initialTab || 'profile')
  }, [initialTab])

  useEffect(() => {
    setFirstName(user?.firstName || '')
    setLastName(user?.lastName || '')
    setCampus(user?.campus || 'HCM')
    setMajorId(user?.majorId || '')
    setCurrentSemester(user?.currentSemester || '')
  }, [user])

  useEffect(() => {
    getMajors()
      .then((res) => {
        if (res?.success && Array.isArray(res?.data)) {
          setMajorsList(res.data.filter((major) => major.majorCode !== 'ALL'))
        }
      })
      .catch((err) => console.error('Failed to load majors:', err))
  }, [])

  const normalizedPlan = String(user?.planName || 'FREE').toUpperCase()
  const planExpiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt) : null
  const hasValidExpiry = planExpiresAt && !Number.isNaN(planExpiresAt.getTime())
  const formattedExpiry = hasValidExpiry
    ? planExpiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null
  const storageLimitMb = Number(user?.planStorageLimitMb || 0)
  const storageUsedBytes = Number(user?.planStorageUsedBytes || 0)
  const storageUsedMb = Number.isFinite(user?.planStorageUsedMb) ? Number(user.planStorageUsedMb) : storageUsedBytes / (1024 * 1024)
  const storagePercent = storageLimitMb > 0 ? Math.min((storageUsedMb / storageLimitMb) * 100, 100) : 0
  const aiDailyLimit = Number(user?.planAiRequestsPerDay || 0)
  const aiUsedToday = Number(user?.planAiRequestsUsedToday || 0)
  const aiDisplayedToday = aiDailyLimit > 0 ? Math.min(aiUsedToday, aiDailyLimit) : aiUsedToday
  const aiPercent = aiDailyLimit > 0 ? Math.min((aiUsedToday / aiDailyLimit) * 100, 100) : 0
  const isOverQuota = Boolean(user?.overQuota)
  const planRights = [
    { label: 'AI Summary', enabled: Boolean(user?.planCanUseAiSummary) },
    { label: 'Flashcards', enabled: Boolean(user?.planCanUseFlashcards) },
    { label: 'Quizzes', enabled: Boolean(user?.planCanUseQuizzes) },
    { label: 'Public documents', enabled: Boolean(user?.planCanPublishDocuments) },
    { label: 'Public folders', enabled: Boolean(user?.planCanPublishFolders) },
  ]

  const formatStorageText = (valueMb) => {
    if (!Number.isFinite(valueMb) || valueMb <= 0) return '0 MB'
    if (valueMb >= 1024) {
      return `${(valueMb / 1024).toFixed(valueMb >= 10240 ? 0 : 1)} GB`
    }
    return `${valueMb.toFixed(valueMb >= 100 ? 0 : 1)} MB`
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const res = await updateUserProfile({
        firstName,
        lastName,
        campus,
        majorId: majorId ? Number.parseInt(majorId, 10) : null,
        currentSemester,
      })
      if (res?.success && res?.data) {
        onUserUpdate({
          ...user,
          email: res.data.email || user?.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          fullName: res.data.fullName,
          campus: res.data.campus,
          majorId: res.data.majorId,
          majorName: res.data.majorName,
          currentSemester: res.data.currentSemester,
        })
        setSuccessMsg('Profile updated successfully!')
      } else {
        setErrorMsg('Unable to update profile.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    setUploadProgress(0)
    try {
      const res = await uploadAvatar(file, (progress) => {
        setUploadProgress(progress)
      })
      if (res?.success && res?.data) {
        onUserUpdate({ ...user, avatarUrl: res.data })
        setSuccessMsg('Profile picture uploaded successfully!')
      } else {
        setErrorMsg('Unable to upload profile picture.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading profile picture.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
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
      setErrorMsg('Please select your student ID card image to upload.')
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
      onUserUpdate?.({ ...user, verificationStatus: 'PENDING', verificationRequestSubmitted: true, verificationReviewNote: null })
      setSuccessMsg('Verification request submitted successfully. Please wait for admin approval.')
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
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-205" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">x</button>
        </header>

        <nav className="settings-modal-tabs bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Profile</button>
          <button className={activeTab === 'plan' ? 'active' : ''} onClick={() => { setActiveTab('plan'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Plan</button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => { setActiveTab('password'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Security</button>
          <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => { setActiveTab('verification'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Verification</button>
        </nav>

        <div className="settings-modal-content">
          {successMsg && <div className="modal-alert success">{successMsg}</div>}
          {errorMsg && <div className="modal-alert error">{errorMsg}</div>}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="avatar-upload-container bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                <img
                  src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"}
                  alt="Avatar"
                  className="avatar-upload-preview"
                />
                <div className="avatar-upload-btn-container">
                  {uploadProgress !== null ? (
                    <div style={{ width: '100%', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }} className="text-slate-600 dark:text-slate-400 font-medium">
                        <span>Uploading avatar...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }} className="dark:bg-slate-700">
                        <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.1s ease-out' }}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="avatar-upload-btn bg-[#6366f1] hover:bg-indigo-700 transition-colors duration-250 cursor-pointer text-white">
                        Change Avatar
                        <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={loading} />
                      </label>
                      <span className="avatar-upload-info text-slate-400 dark:text-slate-500">Supports JPG, PNG max 5MB.</span>
                    </>
                  )}
                </div>
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">Last Name *</label>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" style={{ padding: '8px 12px', borderRadius: '6px' }} />
                </div>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">First Name *</label>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" style={{ padding: '8px 12px', borderRadius: '6px' }} />
                </div>
              </div>

              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Registered Email (Read-only)</label>
                <input value={user?.email || ''} readOnly className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" style={{ outline: 'none', padding: '8px 12px', borderRadius: '6px' }} />
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">Campus *</label>
                  <select value={campus} onChange={(e) => setCampus(e.target.value)} disabled={loading} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" style={{ padding: '8px 12px', borderRadius: '6px' }}>
                    <option value="HCM">FPTU Ho Chi Minh City</option>
                    <option value="HN">FPTU Hanoi</option>
                    <option value="DN">FPTU Da Nang</option>
                    <option value="CT">FPTU Can Tho</option>
                    <option value="QN">FPTU Quy Nhon</option>
                  </select>
                </div>
                <div className="settings-input-group">
                  <label className="text-slate-600 dark:text-slate-400">Current Semester</label>
                  <select value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} disabled={loading} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" style={{ padding: '8px 12px', borderRadius: '6px' }}>
                    <option value="">Select Semester</option>
                    {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="settings-input-group">
                <label className="text-slate-600 dark:text-slate-400">Major</label>
                <select value={majorId} onChange={(e) => setMajorId(e.target.value)} disabled={loading} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200" style={{ padding: '8px 12px', borderRadius: '6px' }}>
                  <option value="">Select Major</option>
                  {majorsList.map(major => (
                    <option key={major.id} value={major.id}>{major.majorName} ({major.majorCode})</option>
                  ))}
                </select>
              </div>

              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {activeTab === 'plan' && (
            <div className="settings-plan-panel">
              <div className="settings-plan-hero">
                <div>
                  <span className="settings-plan-eyebrow">Current plan</span>
                  <h3>{normalizedPlan}</h3>
                  <p>
                    {formattedExpiry
                      ? `Your plan is active until ${formattedExpiry}.`
                      : 'Your current plan is active.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="settings-plan-upgrade-btn cursor-pointer"
                  onClick={() => {
                    onClose?.()
                    onNavigate?.('pricing')
                  }}
                >
                  Compare plans
                </button>
              </div>

              <div className="settings-plan-usage-grid">
                {isOverQuota && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#b45309',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      fontWeight: 600
                    }}
                  >
                    {user?.storageMessage || 'Your current storage usage exceeds the FREE plan limit. You can still view, download, and delete your existing documents, but uploading new documents is temporarily disabled.'}
                  </div>
                )}
                <div className="settings-plan-usage-card">
                  <div className="settings-plan-usage-head">
                    <strong>Storage</strong>
                    <span>{formatStorageText(storageUsedMb)} / {formatStorageText(storageLimitMb)}</span>
                  </div>
                  <div className="settings-plan-progress">
                    <div className="settings-plan-progress__fill settings-plan-progress__fill--storage" style={{ width: `${storagePercent}%` }} />
                  </div>
                  <small>{formatStorageText(Math.max(storageLimitMb - storageUsedMb, 0))} remaining</small>
                </div>

                <div className="settings-plan-usage-card">
                  <div className="settings-plan-usage-head">
                    <strong>AI usage today</strong>
                    <span>{aiDisplayedToday} / {aiDailyLimit || 0} requests</span>
                  </div>
                  <div className="settings-plan-progress">
                    <div className="settings-plan-progress__fill settings-plan-progress__fill--ai" style={{ width: `${aiPercent}%` }} />
                  </div>
                  <small>{Math.max(aiDailyLimit - aiUsedToday, 0)} AI requests left today</small>
                </div>
              </div>

              <div className="settings-plan-rights">
                <div className="settings-plan-rights__header">
                  <strong>Included features</strong>
                  <small>What this plan unlocks for your workspace.</small>
                </div>
                <div className="settings-plan-rights__grid">
                  {planRights.map((right) => (
                    <div
                      key={right.label}
                      className={`settings-plan-right ${right.enabled ? 'is-enabled' : 'is-disabled'}`}
                    >
                      <span>{right.label}</span>
                      <strong>{right.enabled ? 'Included' : 'Locked'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
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
                {verificationStatus === 'rejected' && <span className="settings-status-badge rejected">Rejected</span>}
              </div>

              {((verificationStatus === 'unverified') || verificationStatus === 'rejected' || (verificationStatus === 'pending' && !verificationRequestSubmitted)) && (
                <form onSubmit={handleVerificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '13px', lineHeight: '19px' }} className="dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300 transition-colors duration-300">
                    Please upload a clear photo of your student ID card so the admin team can review it. Accounts that stay unverified for more than 3 days after registration may be banned automatically.
                  </div>
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
                  <button className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', border: 'none', borderRadius: '8px' }}>
                    {loading ? 'Submitting...' : 'Submit Verification Request'}
                  </button>
                </form>
              )}

              {verificationStatus === 'pending' && verificationRequestSubmitted && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontSize: '13px', lineHeight: '18px' }} className="dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 transition-colors duration-300">
                  Your verification request has been submitted successfully. Admin will review and approve your student ID card within the next 24-48 hours.
                </div>
              )}

              {verificationStatus === 'rejected' && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', lineHeight: '18px' }} className="dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300 transition-colors duration-300">
                  {user?.verificationReviewNote
                    ? `Your previous verification request was rejected. Admin note: ${user.verificationReviewNote}`
                    : 'Your previous verification request was rejected. Please upload a clearer student ID image and submit again.'}
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
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer" style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', fontWeight: 500 }} type="button">Close</button>
        </footer>
      </section>
    </div>
  )
}
