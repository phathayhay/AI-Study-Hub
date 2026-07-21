import { useEffect, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import { changePassword } from '../../features/auth/authService'
import { uploadAvatar, verifyStudent, updateUserProfile } from '../../services/userService'
import { getMajors } from '../../services/courseService'
import { getCurrentSubscription } from '../../services/subscriptionService'
import { useLanguage } from '../../context/LanguageContext'

export function SettingsModal({ onClose, user, onUserUpdate, onNavigate, initialTab = 'profile' }) {
  const { t } = useLanguage()
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
  const [currentSubscription, setCurrentSubscription] = useState(null)
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

  useEffect(() => {
    if (activeTab !== 'plan') return
    getCurrentSubscription()
      .then((res) => setCurrentSubscription(res?.data || null))
      .catch((err) => console.error('Failed to load current subscription:', err))
  }, [activeTab, user?.planName])

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
    { label: t('aiSummaryFeature'), enabled: Boolean(user?.planCanUseAiSummary) },
    { label: t('flashcardsFeature'), enabled: Boolean(user?.planCanUseFlashcards) },
    { label: t('quizzesFeature'), enabled: Boolean(user?.planCanUseQuizzes) },
    { label: t('publicDocsFeature'), enabled: Boolean(user?.planCanPublishDocuments) },
    { label: t('publicFoldersFeature'), enabled: Boolean(user?.planCanPublishFolders) },
  ]

  const formatStorageText = (valueMb) => {
    if (!Number.isFinite(valueMb) || valueMb <= 0) return '0 MB'
    if (valueMb >= 1024) {
      return `${(valueMb / 1024).toFixed(valueMb >= 10240 ? 0 : 1)} GB`
    }
    return `${valueMb.toFixed(valueMb >= 100 ? 0 : 1)} MB`
  }

  const upcomingPlanChanges = currentSubscription?.upcomingVersion
    ? [
        currentSubscription.upcomingVersion.storageLimitMb !== currentSubscription.storageLimitMb
          ? `${formatStorageText(Number(currentSubscription.upcomingVersion.storageLimitMb))} storage`
          : null,
        currentSubscription.upcomingVersion.aiRequestsPerDay !== currentSubscription.aiRequestsPerDay
          ? `${currentSubscription.upcomingVersion.aiRequestsPerDay} AI requests per day`
          : null,
        currentSubscription.upcomingVersion.downloadLimit !== currentSubscription.downloadLimit
          ? `${currentSubscription.upcomingVersion.downloadLimit} downloads`
          : null,
        currentSubscription.upcomingVersion.bookmarkLimit !== currentSubscription.bookmarkLimit
          ? `${currentSubscription.upcomingVersion.bookmarkLimit} bookmarks`
          : null,
        Number(currentSubscription.upcomingVersion.price) !== Number(currentSubscription.price)
          ? `${Number(currentSubscription.upcomingVersion.price || 0).toLocaleString('vi-VN')} VND per billing cycle`
          : null,
      ].filter(Boolean)
    : []

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
      <section className="settings-modal-v2">
        <header className="settings-modal-header">
          <div className="settings-modal-header__brand">
            <span className="settings-modal-header__icon">
              <StudyHubIcon name="settings" size={20} />
            </span>
            <h2>{t('accountSettings')}</h2>
          </div>
          <button onClick={onClose} className="settings-close-btn" aria-label="Close" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <nav className="settings-nav-tabs">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }} type="button">
            <StudyHubIcon name="user" size={16} />
            <span>{t('profile')}</span>
          </button>
          <button className={activeTab === 'plan' ? 'active' : ''} onClick={() => { setActiveTab('plan'); setSuccessMsg(''); setErrorMsg(''); }} type="button">
            <StudyHubIcon name="sparkle" size={16} />
            <span>{t('plan')}</span>
          </button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => { setActiveTab('password'); setSuccessMsg(''); setErrorMsg(''); }} type="button">
            <StudyHubIcon name="lock" size={16} />
            <span>{t('security')}</span>
          </button>
          <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => { setActiveTab('verification'); setSuccessMsg(''); setErrorMsg(''); }} type="button">
            <StudyHubIcon name="check" size={16} />
            <span>{t('verification')}</span>
          </button>
        </nav>

        <div className="settings-modal-body">
          {successMsg && <div className="settings-alert success">{successMsg}</div>}
          {errorMsg && <div className="settings-alert error">{errorMsg}</div>}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="avatar-banner-card">
                <div className="avatar-ring-wrapper">
                  <img
                    src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120"}
                    alt="Avatar"
                    className={`avatar-banner-img ${uploadProgress !== null ? 'is-uploading' : ''}`}
                  />
                  <label className="avatar-camera-overlay" title={t('changeAvatar')}>
                    <StudyHubIcon name="plus" size={16} />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={loading} style={{ display: 'none' }} />
                  </label>
                </div>
                <div className="avatar-banner-info">
                  {uploadProgress !== null ? (
                    <div className="upload-progress-card">
                      <div className="upload-progress-header">
                        <div className="upload-progress-title">
                          <span>{uploadProgress === 100 ? t('processingAvatar') : t('uploadingAvatar')}</span>
                        </div>
                        <span className="upload-progress-badge">{uploadProgress}%</span>
                      </div>
                      <div className="upload-progress-track">
                        <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="avatar-banner-actions">
                        <label className="settings-avatar-btn">
                          <StudyHubIcon name="plus" size={16} />
                          <span>{t('changeAvatar')}</span>
                          <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={loading} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <span className="avatar-banner-hint">{t('supportsJpgPng')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-field">
                  <label>{t('lastNameLabel')}</label>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} className="settings-input" />
                </div>
                <div className="settings-field">
                  <label>{t('firstNameLabel')}</label>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} className="settings-input" />
                </div>
              </div>

              <div className="settings-field">
                <label>{t('emailReadOnlyLabel')}</label>
                <input value={user?.email || ''} readOnly className="settings-input is-readonly" />
              </div>

              <div className="settings-form-row">
                <div className="settings-field">
                  <label>{t('campusLabel')}</label>
                  <select value={campus} onChange={(e) => setCampus(e.target.value)} disabled={loading} className="settings-select">
                    <option value="HCM">FPTU Ho Chi Minh City</option>
                    <option value="HN">FPTU Hanoi</option>
                    <option value="DN">FPTU Da Nang</option>
                    <option value="CT">FPTU Can Tho</option>
                    <option value="QN">FPTU Quy Nhon</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>{t('currentSemesterLabel')}</label>
                  <select value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} disabled={loading} className="settings-select">
                    <option value="">{t('selectSemester')}</option>
                    {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="settings-field">
                <label>{t('majorLabelForm')}</label>
                <select value={majorId} onChange={(e) => setMajorId(e.target.value)} disabled={loading} className="settings-select">
                  <option value="">{t('selectMajor')}</option>
                  {majorsList.map(major => (
                    <option key={major.id} value={major.id}>{major.majorName} ({major.majorCode})</option>
                  ))}
                </select>
              </div>

              <button className="settings-submit-btn" type="submit" disabled={loading}>
                {loading ? t('saving') : t('saveProfileChanges')}
              </button>
            </form>
          )}

          {activeTab === 'plan' && (
            <div className="settings-plan-panel">
              <div className="settings-plan-hero">
                <div>
                  <span className="settings-plan-eyebrow">{t('currentPlan')}</span>
                  <h3>{normalizedPlan}</h3>
                  <p>
                    {formattedExpiry
                      ? `${t('planActiveUntil')} ${formattedExpiry}.`
                      : t('planActive')}
                  </p>
                </div>
                <button
                  type="button"
                  className="settings-plan-upgrade-btn"
                  onClick={() => {
                    onClose?.()
                    onNavigate?.('pricing')
                  }}
                >
                  {t('comparePlans')}
                </button>
              </div>

              {currentSubscription?.upcomingVersion && (
                <div className="settings-notice-box info">
                  <strong>Changes coming at renewal</strong>
                  <div>Your current benefits remain unchanged until the end of this billing period.</div>
                  {upcomingPlanChanges.length > 0 && (
                    <div className="settings-notice-tags">
                      {upcomingPlanChanges.map((change) => (
                        <span key={change} className="settings-notice-tag">
                          {change}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="settings-plan-usage-grid">
                {isOverQuota && (
                  <div className="settings-notice-box warning">
                    {user?.storageMessage || 'Your current storage usage exceeds the FREE plan limit. You can still view, download, and delete your existing documents, but uploading new documents is temporarily disabled.'}
                  </div>
                )}
                <div className="settings-plan-usage-card">
                  <div className="settings-plan-usage-head">
                    <strong>{t('storage')}</strong>
                    <span>{formatStorageText(storageUsedMb)} / {formatStorageText(storageLimitMb)}</span>
                  </div>
                  <div className="settings-plan-progress">
                    <div className="settings-plan-progress__fill settings-plan-progress__fill--storage" style={{ width: `${storagePercent}%` }} />
                  </div>
                  <small>{formatStorageText(Math.max(storageLimitMb - storageUsedMb, 0))} {t('remaining')}</small>
                </div>

                <div className="settings-plan-usage-card">
                  <div className="settings-plan-usage-head">
                    <strong>{t('aiUsageToday')}</strong>
                    <span>{aiDisplayedToday} / {aiDailyLimit || 0} {t('requests')}</span>
                  </div>
                  <div className="settings-plan-progress">
                    <div className="settings-plan-progress__fill settings-plan-progress__fill--ai" style={{ width: `${aiPercent}%` }} />
                  </div>
                  <small>{Math.max(aiDailyLimit - aiUsedToday, 0)} {t('aiRequestsLeftToday')}</small>
                </div>
              </div>

              <div className="settings-plan-rights">
                <div className="settings-plan-rights__header">
                  <strong>{t('includedFeatures')}</strong>
                  <small>{t('planUnlocksText')}</small>
                </div>
                <div className="settings-plan-rights__grid">
                  {planRights.map((right) => (
                    <div
                      key={right.label}
                      className={`settings-plan-right ${right.enabled ? 'is-enabled' : 'is-disabled'}`}
                    >
                      <span>{right.label}</span>
                      <strong>{right.enabled ? t('included') : t('locked')}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="settings-field">
                <label>{t('currentPasswordLabel')}</label>
                <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={loading} placeholder={t('enterCurrentPassword')} className="settings-input" />
              </div>
              <div className="settings-field">
                <label>{t('newPasswordLabel')}</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} placeholder={t('atLeast6Chars')} className="settings-input" />
              </div>
              <div className="settings-field">
                <label>{t('confirmNewPasswordLabel')}</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} placeholder={t('enterNewPasswordAgain')} className="settings-input" />
              </div>
              <button className="settings-submit-btn" type="submit" disabled={loading}>
                {loading ? t('saving') : t('changePasswordBtn')}
              </button>
            </form>
          )}

          {activeTab === 'verification' && (
            <div className="settings-form">
              <div className="settings-verification-bar">
                <span>{t('verificationStatusLabel')}</span>
                {verificationStatus === 'verified' && <span className="settings-status-badge verified">{t('statusVerified')}</span>}
                {verificationStatus === 'pending' && <span className="settings-status-badge pending">{t('statusPending')}</span>}
                {verificationStatus === 'unverified' && <span className="settings-status-badge unverified">{t('statusUnverified')}</span>}
                {verificationStatus === 'rejected' && <span className="settings-status-badge rejected">{t('statusRejected')}</span>}
              </div>

              {((verificationStatus === 'unverified') || verificationStatus === 'rejected' || (verificationStatus === 'pending' && !verificationRequestSubmitted)) && (
                <form onSubmit={handleVerificationSubmit} className="settings-form">
                  <div className="settings-notice-box info">
                    {t('verificationNoticeText')}
                  </div>
                  <div className="settings-field">
                    <label>{t('uploadStudentIdCardLabel')}</label>
                    <div className="avatar-banner-card">
                      <div className="avatar-banner-info">
                        <input type="file" accept="image/*" onChange={(e) => setVerificationFile(e.target.files[0])} disabled={loading} required className="settings-file-input" />
                        <span className="avatar-banner-hint">
                          {verificationFile ? `${t('selectedFile')} ${verificationFile.name}` : t('pleaseSelectImage')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="settings-submit-btn" type="submit" disabled={loading}>
                    {loading ? t('submitting') : t('submitVerificationRequest')}
                  </button>
                </form>
              )}

              {verificationStatus === 'pending' && verificationRequestSubmitted && (
                <div className="settings-notice-box warning">
                  {t('pendingReviewNotice')}
                </div>
              )}

              {verificationStatus === 'rejected' && (
                <div className="settings-notice-box danger">
                  {user?.verificationReviewNote
                    ? `Your previous verification request was rejected. Admin note: ${user.verificationReviewNote}`
                    : 'Your previous verification request was rejected. Please upload a clearer student ID image and submit again.'}
                </div>
              )}

              {verificationStatus === 'verified' && (
                <div className="settings-notice-box success">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{t('officialStudentVerified')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="settings-modal-footer">
          <button onClick={onClose} className="settings-footer-close-btn" type="button">{t('close')}</button>
        </footer>
      </section>
    </div>
  )
}

export default SettingsModal
