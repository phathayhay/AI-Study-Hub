import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'

export function NotificationPanel({
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkAsRead,
  onMarkAllRead,
  onOpenNotification
}) {
  const [activeTab, setActiveTab] = useState('All')
  const panelRef = useRef(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return
      if (event.target.closest?.('[data-notification-trigger]')) return
      onClose?.()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.document.addEventListener('pointerdown', handlePointerDown)
    window.document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown)
      window.document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const getNoticeVisual = (item) => {
    switch (item.notificationType) {
      case 'COMMENT':
        if ((item.title || '').toLowerCase().includes('reply')) {
          return { tone: 'purple', icon: 'reply' }
        }
        return { tone: 'info', icon: 'message' }
      case 'DOCUMENT':
        if ((item.title || '').toLowerCase().includes('reject')) {
          return { tone: 'danger', icon: 'x' }
        }
        return { tone: 'success', icon: 'check' }
      case 'REPORT':
        return { tone: 'danger', icon: 'flag' }
      case 'SHARE':
        return { tone: 'info', icon: 'upload' }
      default:
        return { tone: 'info', icon: 'bell' }
    }
  }

  const formatTimeAgo = (value) => {
    if (!value) return 'Just now'
    const createdAt = new Date(value)
    if (Number.isNaN(createdAt.getTime())) return 'Just now'

    const diffMs = now - createdAt.getTime()
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const tabs = ['All', 'Unread', 'Documents', 'Interactions']
  const counts = {
    All: notifications.length,
    Unread: notifications.filter((item) => !item.isRead).length,
    Documents: notifications.filter((item) => ['DOCUMENT', 'REPORT', 'SYSTEM'].includes(item.notificationType)).length,
    Interactions: notifications.filter((item) => ['COMMENT', 'SHARE'].includes(item.notificationType)).length
  }

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'Unread') return !item.isRead
    if (activeTab === 'Documents') return ['DOCUMENT', 'REPORT', 'SYSTEM'].includes(item.notificationType)
    if (activeTab === 'Interactions') return ['COMMENT', 'SHARE'].includes(item.notificationType)
    return true
  })

  return (
    <aside className="notification-panel" ref={panelRef}>
      <header>
        <h2><StudyHubIcon name="bell" size={22} /> Notifications <span>{unreadCount}</span></h2>
        <button disabled={!unreadCount} onClick={onMarkAllRead} type="button">Mark all read</button>
        <button onClick={onClose} type="button"><StudyHubIcon name="close" size={18} /></button>
      </header>
      <nav>
        {tabs.map((item) => (
          <button className={activeTab === item ? 'is-active' : ''} key={item} onClick={() => setActiveTab(item)} type="button">
            {item}
            <small>{counts[item] || ''}</small>
          </button>
        ))}
      </nav>
      <div className="notification-panel__body">
        {loading ? (
          <div style={{ padding: '24px 22px', color: '#64748b' }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: '24px 22px', color: '#64748b' }}>No notifications yet.</div>
        ) : (
          filteredNotifications.map((item) => {
            const visual = getNoticeVisual(item)
            return (
              <article
                className={`notice-item notice-item--${visual.tone}`}
                key={item.id}
                onClick={() => onOpenNotification?.(item)}
                style={{ cursor: 'pointer', opacity: item.isRead ? 0.82 : 1 }}
              >
                <span><StudyHubIcon name={visual.icon} size={22} /></span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <strong>{item.notificationType === 'DOCUMENT' ? 'AI Study Hub' : 'Activity'}</strong> <small>{formatTimeAgo(item.createdAt)}</small>
                </div>
              </article>
            )
          })
        )}
        <button className="all-notifications" type="button">End of notifications</button>
      </div>
    </aside>
  )
}
