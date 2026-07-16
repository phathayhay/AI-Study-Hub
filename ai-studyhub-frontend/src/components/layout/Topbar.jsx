import { useState, useEffect } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'

function VisibilityBadge({ visibility }) {
  if (!visibility) return null
  const isPrivate = visibility === 'PRIVATE'
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: isPrivate ? '#fef3c7' : '#d1fae5',
        color: isPrivate ? '#b45309' : '#065f46',
        border: isPrivate ? '1px solid #fde68a' : '1px solid #a7f3d0'
      }}
    >
      {isPrivate ? '🔒 Private' : '🌍 Public'}
    </span>
  )
}

export default function Topbar({
  onNotifications,
  notificationUnreadCount = 0,
  onNavigate,
  guest = false,
  user,
  title,
  active = 'home',
  breadcrumbs = [],
  onBreadcrumbClick,
  onRenameTitle,
  visibility = null,
  route = ''
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

  const displayTitle = active === 'explore' ? 'Explore Documents'
    : active === 'library' ? 'My Library'
      : active === 'library-shared' ? 'Shared with me'
        : active === 'library-folders' ? 'Folders'
          : active === 'library-favorites' ? 'Favorites'
            : active === 'library-recent' ? 'Recent'
              : active === 'upload' ? 'Upload Document'
                : active === 'pricing' ? 'Upgrade Plans'
                  : active === 'profile' ? 'Profile'
                    : 'Home'

  return (
    <header
      className="topbar dark:bg-slate-800 dark:border-b-slate-700 bg-[#f8fafc] border-b border-[#e2e8f0] transition-colors duration-300 ease-in-out"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '64px' }}
    >
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {title && breadcrumbs && breadcrumbs.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {index > 0 && <StudyHubIcon name="chevron" size={14} style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }} />}
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

            {active === 'study' && onRenameTitle ? (
              isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-[#4f46e5] dark:border-slate-600 transition-colors duration-300 ease-in-out"
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    onClick={() => setIsEditing(true)}
                    className="text-gray-900 dark:text-white transition-colors duration-300 ease-in-out"
                    style={{ borderBottom: '1px dashed #4f46e5', paddingBottom: '2px', cursor: 'pointer' }}
                  >
                    {title}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                  >
                    <StudyHubIcon name="edit" size={16} />
                  </button>
                  <VisibilityBadge visibility={visibility} />
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-gray-900 dark:text-white transition-colors duration-300 ease-in-out">{title}</span>
                <VisibilityBadge visibility={visibility} />
              </div>
            )}
          </div>
        ) : (
          displayTitle
        )}
      </div>

      {guest ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            data-notification-trigger
            onClick={onNotifications}
            className="bg-white dark:bg-slate-700 border border-[#e2e8f0] dark:border-slate-600 transition-colors duration-300 ease-in-out"
            style={{ width: '36px', height: '36px', borderRadius: '50%', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
          >
            <StudyHubIcon name="bell" size={16} />
            {notificationUnreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </header>
  )
}
