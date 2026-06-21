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
        <h2><StudyHubIcon name="bell" size={22} /> Thông báo <span>3</span></h2>
        <button type="button">✓ Đọc tất cả</button>
        <button onClick={onClose} type="button"><StudyHubIcon name="close" size={18} /></button>
      </header>
      <nav>{['Tất cả', 'Chưa đọc', 'Tài liệu', 'Tương tác'].map((item, index) => <button className={index === 0 ? 'is-active' : ''} key={item}>{item}<small>{index ? index + 1 : ''}</small></button>)}</nav>
      {notifications.map((item) => (
        <article className={`notice-item notice-item--${item.type}`} key={item.id}>
          <span><StudyHubIcon name={item.icon} size={22} /></span>
          <div><h3>{item.title}</h3><p>{item.text}</p><strong>{item.author}</strong> <small>{item.time}</small></div>
        </article>
      ))}
      <button className="all-notifications" type="button">Xem tất cả thông báo ›</button>
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
      <section className="file-modal">
        <header><h2>{file.name}</h2><button onClick={onClose} type="button">×</button></header>
        <div className="file-preview-hero"><StudyHubIcon name="file" size={82} /><p>{file.kind} Document</p><small>{file.category ?? file.subject}</small></div>
        <InfoBlock label="Document Name" value={file.name} />
        <InfoBlock label="Type" value={file.kind} />
        <InfoBlock label="Category" value={file.category ?? file.subject} />
        <InfoBlock label="Upload Date" value={file.date} />
        <footer>
          <button disabled={opening} onClick={onClose} type="button">Close</button>
          <button className="purple-button" disabled={opening} onClick={handleView} type="button">
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
        setDoc({ id: documentId, title: 'Đang tải...', code: 'DOC' })
      })
  }, [documentId])

  const d = doc || { title: 'Đang tải...', code: 'DOC' }

  const handleSubmit = () => {
    if (!reason.trim()) {
      window.showToast?.('Vui lòng nhập lý do báo cáo', 'error')
      return
    }
    setLoading(true)
    reportDocument(documentId, reportType, reason.trim())
      .then(() => {
        window.showToast?.('Gửi báo cáo thành công', 'success')
        onClose()
      })
      .catch(err => {
        window.showToast?.(err.message || 'Gửi báo cáo thất bại', 'error')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-backdrop">
      <section className="report-modal">
        <header><h2><StudyHubIcon name="flag" size={18} /> Báo cáo tài liệu</h2><button onClick={onClose} type="button">×</button></header>
        <div className="report-doc"><Badge tone="blue">{d.code || d.id?.toString().slice(-6)}</Badge><strong>{d.title}</strong></div>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          Loại vi phạm *
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          >
            <option value="SPAM">Spam / Rác</option>
            <option value="COPYRIGHT">Bản quyền</option>
            <option value="INAPPROPRIATE">Không phù hợp</option>
            <option value="OTHER">Lý do khác</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          Mô tả chi tiết *
          <textarea 
            placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với tài liệu này..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', resize: 'vertical', outline: 'none' }}
          />
        </label>
        
        <div className="warning-box">Lưu ý: Báo cáo sai sự thật có thể dẫn đến việc tài khoản bị khóa.</div>
        <footer>
          <button onClick={onClose} disabled={loading} type="button">Hủy</button>
          <button className="danger-button" disabled={loading} onClick={handleSubmit} type="button">
            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
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
      const res = await uploadAvatar(file)
      if (res?.success && res?.data) {
        const updatedUser = { ...user, avatarUrl: res.data }
        onUserUpdate(updatedUser)
        setSuccessMsg('Tải lên ảnh đại diện thành công!')
      } else {
        setErrorMsg('Không thể tải lên ảnh đại diện.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi tải lên ảnh đại diện.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }
    
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await changePassword({ oldPassword, newPassword, confirmPassword })
      setSuccessMsg('Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setErrorMsg(err.message || 'Mật khẩu cũ không chính xác.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (e) => {
    e.preventDefault()
    if (!verificationFile) {
      setErrorMsg('Vui lòng chọn ảnh thẻ sinh viên để tải lên.')
      return
    }

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await verifyStudent(verificationFile)
      setVerificationStatus('pending')
      localStorage.setItem('verificationStatus', 'pending')
      setSuccessMsg('Gửi yêu cầu xác minh thành công! Vui lòng chờ admin phê duyệt.')
      setVerificationFile(null)
    } catch (err) {
      setErrorMsg(err.message || 'Không thể gửi yêu cầu xác minh.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="settings-modal">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StudyHubIcon name="settings" size={20} /> Cài đặt tài khoản
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} type="button">×</button>
        </header>

        <nav className="settings-modal-tabs">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Thông tin</button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => { setActiveTab('password'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Bảo mật</button>
          <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => { setActiveTab('verification'); setSuccessMsg(''); setErrorMsg(''); }} type="button">Xác minh</button>
        </nav>

        <div className="settings-modal-content">
          {successMsg && <div className="modal-alert success">{successMsg}</div>}
          {errorMsg && <div className="modal-alert error">{errorMsg}</div>}

          {activeTab === 'profile' && (
            <>
              <div className="avatar-upload-container">
                <img 
                  src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"} 
                  alt="Avatar" 
                  className="avatar-upload-preview"
                />
                <div className="avatar-upload-btn-container">
                  <label className="avatar-upload-btn">
                    Thay ảnh đại diện
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={loading} />
                  </label>
                  <span className="avatar-upload-info">Chấp nhận JPG, PNG tối đa 5MB.</span>
                </div>
              </div>

              <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="settings-input-group">
                  <label>Họ và tên đệm</label>
                  <input value={user?.lastName || ''} readOnly style={{ backgroundColor: 'var(--bg-tertiary, #f1f5f9)', color: 'var(--text-muted, #64748b)' }} />
                </div>
                <div className="settings-input-group">
                  <label>Tên</label>
                  <input value={user?.firstName || ''} readOnly style={{ backgroundColor: 'var(--bg-tertiary, #f1f5f9)', color: 'var(--text-muted, #64748b)' }} />
                </div>
              </div>

              <div className="settings-input-group" style={{ marginTop: '16px' }}>
                <label>Email đăng ký</label>
                <input value={user?.email || ''} readOnly style={{ backgroundColor: 'var(--bg-tertiary, #f1f5f9)', color: 'var(--text-muted, #64748b)' }} />
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label>Mật khẩu cũ *</label>
                <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} disabled={loading} placeholder="Nhập mật khẩu hiện tại" />
              </div>
              <div className="settings-input-group">
                <label>Mật khẩu mới *</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} placeholder="Ít nhất 6 ký tự" />
              </div>
              <div className="settings-input-group">
                <label>Xác nhận mật khẩu mới *</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} placeholder="Nhập lại mật khẩu mới" />
              </div>
              <button className="purple-button" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}

          {activeTab === 'verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Trạng thái xác minh:</span>
                {verificationStatus === 'verified' && <span className="settings-status-badge verified">Đã xác minh</span>}
                {verificationStatus === 'pending' && <span className="settings-status-badge pending">Chờ duyệt</span>}
                {verificationStatus === 'unverified' && <span className="settings-status-badge unverified">Chưa xác minh</span>}
              </div>

              {verificationStatus === 'unverified' && (
                <form onSubmit={handleVerificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="settings-input-group">
                    <label>Tải lên ảnh Thẻ sinh viên (Mặt trước) *</label>
                    <div className="avatar-upload-container">
                      <div className="avatar-upload-btn-container" style={{ flex: 1 }}>
                        <input type="file" accept="image/*" onChange={(e) => setVerificationFile(e.target.files[0])} disabled={loading} required />
                        <span className="avatar-upload-info" style={{ marginTop: '4px' }}>
                          {verificationFile ? `Đã chọn: ${verificationFile.name}` : 'Vui lòng chọn ảnh thẻ sinh viên của bạn.'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="purple-button" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu xác minh'}
                  </button>
                </form>
              )}

              {verificationStatus === 'pending' && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', fontSize: '13px', lineHeight: '18px' }}>
                  Yêu cầu xác minh của bạn đã được gửi thành công. Admin sẽ kiểm tra và phê duyệt thẻ sinh viên của bạn trong vòng 24-48 giờ tới.
                </div>
              )}

              {verificationStatus === 'verified' && (
                <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '13px', lineHeight: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Tài khoản của bạn đã được xác minh là sinh viên chính thức.
                </div>
              )}
            </div>
          )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Đóng</button>
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
      <section className="feedback-modal">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <circle cx="6" cy="9" r="1" />
              <circle cx="6" cy="13" r="1" />
            </svg>
            Yêu cầu tính năng mới
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} type="button">×</button>
        </header>

        <div className="settings-modal-content">
          {success ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justify: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <strong style={{ fontSize: '16px', color: 'var(--text-primary, #0f172a)' }}>Gửi yêu cầu thành công!</strong>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: '20px' }}>
                Cảm ơn đóng góp quý giá của bạn. Chúng tôi sẽ nghiên cứu tính năng này để cải thiện AI Study Hub trong thời gian tới.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label>Tên tính năng đề xuất *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ví dụ: Tính năng thi thử trắc nghiệm online" />
              </div>
              <div className="settings-input-group">
                <label>Mô tả chi tiết *</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} placeholder="Vui lòng mô tả tính năng này sẽ hoạt động như thế nào và lợi ích của nó..." />
              </div>
              <button className="purple-button" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </form>
          )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', gap: '12px' }}>
          {success ? (
            <button onClick={onClose} className="purple-button" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }} type="button">Xong</button>
          ) : (
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Hủy</button>
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
      <section className="support-modal">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            Trung tâm hỗ trợ
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} type="button">×</button>
        </header>

        <div className="settings-modal-content">
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Kênh chính thức:</strong></div>
            <div>📧 Email: support@aistudyhub.vn</div>
            <div>📞 Hotline: 1900 8198 (8h00 - 22h00)</div>
          </div>

          {success ? (
            <div style={{ padding: '12px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justify: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <strong style={{ fontSize: '16px', color: 'var(--text-primary, #0f172a)' }}>Gửi thành công!</strong>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: '20px' }}>
                Yêu cầu hỗ trợ của bạn đã được tiếp nhận. Đội ngũ kỹ thuật sẽ liên hệ lại với bạn qua email sớm nhất có thể.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="settings-input-group">
                <label>Email liên hệ *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Nhập email của bạn để chúng tôi phản hồi" />
              </div>
              <div className="settings-input-group">
                <label>Mô tả vấn đề cần giúp đỡ *</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required rows={4} placeholder="Ví dụ: Tôi không tải được tài liệu mặc dù đã trả phí..." />
              </div>
              <button className="purple-button" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 18px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600 }}>
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu trợ giúp'}
              </button>
            </form>
          )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', gap: '12px' }}>
          {success ? (
            <button onClick={onClose} className="purple-button" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }} type="button">Xong</button>
          ) : (
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Hủy</button>
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
      <section className="extension-modal">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="8" x2="20.75" y2="8" />
              <line x1="12" y1="16" x2="3.25" y2="16" />
              <line x1="10" y1="10" x2="5.5" y2="18.5" />
            </svg>
            Chrome Extension Beta
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)' }} type="button">×</button>
        </header>

        <div className="settings-modal-content" style={{ gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary, #475569)', lineHeight: '20px' }}>
            AI Study Hub Chrome Extension giúp bạn phân tích, tóm tắt và đặt câu hỏi cho bất kỳ tài liệu hay trang web nào ngay khi đang lướt web học tập trên Chrome.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Hướng dẫn cài đặt tiện ích:</span>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '20px', color: 'var(--text-secondary, #475569)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Bấm nút <strong>Tải tiện ích (Beta)</strong> bên dưới để tải file <code>ai-studyhub-extension.zip</code>.</li>
              <li>Giải nén file zip vừa tải xuống một thư mục trên máy tính.</li>
              <li>Mở trình duyệt Google Chrome và truy cập đường dẫn: <code>chrome://extensions/</code></li>
              <li>Bật chế độ nhà phát triển (<strong>Developer mode</strong>) ở góc trên bên phải Chrome.</li>
              <li>Bấm chọn nút <strong>Load unpacked</strong> ở góc trên bên trái, rồi chọn thư mục bạn đã giải nén ở bước 2.</li>
            </ol>
          </div>

          <button onClick={handleDownload} className="purple-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, width: '100%' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Tải tiện ích (Beta)
          </button>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-color, #e2e8f0)', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'transparent', cursor: 'pointer', fontWeight: 500 }} type="button">Đóng</button>
        </footer>
      </section>
    </div>
  )
}

