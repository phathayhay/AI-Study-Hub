import { useState, useEffect } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'

export default function Topbar({
  onNotifications,
  onNavigate,
  guest = false,
  user,
  title,
  active = 'home',
  breadcrumbs = [],
  onBreadcrumbClick,
  onRenameTitle
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    if (title) {
      setEditedName(title)
    }
  }, [title])

  const handleSave = () => {
    const trimmed = editedName.trim()
    if (trimmed && trimmed !== title) {
      onRenameTitle?.(trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedName(title || '')
      setIsEditing(false)
    }
  }

  const displayTitle = active === 'explore' ? 'Khám phá tài liệu'
                     : active === 'library' ? 'Thư viện'
                     : active === 'library-shared' ? 'Thư viện'
                     : active === 'library-folders' ? 'Thư mục'
                     : active === 'upload' ? 'Tải lên'
                     : active === 'pricing' ? 'Bảng giá'
                     : active === 'profile' ? 'Hồ sơ cá nhân'
                     : 'Home'

  return (
    <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '64px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {title && active === 'study' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onBreadcrumbClick?.(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '15px',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Home
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StudyHubIcon name="chevron" size={14} style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }} />
                <button
                  onClick={() => onBreadcrumbClick?.(crumb.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
            <StudyHubIcon name="chevron" size={14} style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }} />
            
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: '#fff',
                    border: '1.5px solid #4f46e5',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    outline: 'none',
                    width: '240px'
                  }}
                />
                <button 
                  onClick={handleSave}
                  style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                >
                  <StudyHubIcon name="edit" size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  onClick={() => setIsEditing(true)}
                  style={{ color: '#0f172a', borderBottom: '1px dashed #4f46e5', paddingBottom: '2px', cursor: 'pointer' }}
                >
                  {title}
                </span>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                >
                  <StudyHubIcon name="edit" size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          displayTitle
        )}
      </div>
      
      {guest ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {(active === 'study' || active === 'doc-detail' || !!title) && (
            <button style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', color: '#6366f1', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Share">
              <StudyHubIcon name="upload" size={16} />
            </button>
          )}
          
          <button onClick={onNotifications} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', color: '#6366f1', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <StudyHubIcon name="bell" size={16} />
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>0</span>
          </button>
        </div>
      )}
    </header>
  )
}