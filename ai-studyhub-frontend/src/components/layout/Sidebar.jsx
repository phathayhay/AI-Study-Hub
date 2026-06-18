import { useState, useEffect } from 'react'
import { mainNavItems, publicNavItems } from '../../data/studyHubData'
import StudyHubIcon from '../icons/StudyHubIcons'
import Brand from './Brand'

export default function Sidebar({ active = 'home', guest = false, onNavigate, user, collapsed = false, onToggleCollapse }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(localStorage.getItem('theme') === 'dark')
    }
    window.addEventListener('storage', checkTheme)
    return () => window.removeEventListener('storage', checkTheme)
  }, [])

  const toggleDark = () => {
    const newDark = !isDark
    setIsDark(newDark)
    if (newDark) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : guest ? '?' : 'SV'

  const renderNavButton = (routeKey, icon, label) => {
    const isActive = active === routeKey
    return (
      <button 
        onClick={() => onNavigate?.(routeKey)} 
        style={{ 
          width: '100%', 
          padding: '8px', 
          background: 'transparent', 
          color: isActive ? '#6366f1' : '#475569', 
          border: 'none', 
          borderRadius: '6px', 
          fontSize: '14px', 
          fontWeight: isActive ? 600 : 500, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start', 
          gap: '12px', 
          cursor: 'pointer', 
          textAlign: 'left',
          transition: 'all 0.2s'
        }}
        title={collapsed ? label : undefined}
        className="sidebar__nav-item"
      >
        <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#6366f1' : 'inherit' }}>
          {icon}
        </span>
        {!collapsed && <span>{label}</span>}
      </button>
    )
  }

  return (
    <aside 
      className="sidebar" 
      style={{ 
        width: collapsed ? '72px' : '256px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        borderRight: '1px solid #e2e8f0', 
        backgroundColor: '#f8fafc',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          padding: collapsed ? '16px 8px 12px' : '16px 16px 12px', 
          borderBottom: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {collapsed ? (
          <>
            <Brand onClick={onToggleCollapse} compact={true} />
            <button 
              onClick={onToggleCollapse}
              style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                color: '#6366f1', 
                width: '36px', 
                height: '36px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: 0
              }} 
              className="sidebar-toggle-btn"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 15 3-3-3-3" />
              </svg>
            </button>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Brand 
              onClick={() => onNavigate?.(guest ? 'guest-home' : 'library')} 
              compact={false} 
            />
            <button 
              onClick={onToggleCollapse}
              style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '6px', 
                color: '#64748b', 
                width: '32px', 
                height: '32px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: 0
              }} 
              className="sidebar-toggle-btn"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: collapsed ? '12px 8px' : '16px', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => onNavigate?.('new-study-session')} 
          style={{ 
            width: collapsed ? '44px' : '100%', 
            height: '44px',
            padding: 0, 
            backgroundColor: '#6366f1', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: collapsed ? '0' : '8px', 
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)'
          }}
          title={collapsed ? "New Study Session" : undefined}
        >
          <StudyHubIcon name="plus" size={18} />
          {!collapsed && "New Study Session"}
        </button>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 8px' : '0 16px', display: 'flex', flexDirection: 'column', gap: collapsed ? '12px' : '20px' }}>
        {guest ? (
          collapsed ? (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              {renderNavButton('guest-home', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              ), 'Trang chủ')}
              
              {renderNavButton('explore', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              ), 'Khám phá')}

              {renderNavButton('pricing', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ), 'Bảng giá')}
            </nav>
          ) : (
            <div>
              <h4 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, paddingLeft: '8px', marginBottom: '8px' }}>Menu</h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {renderNavButton('guest-home', (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ), 'Trang chủ')}
                
                {renderNavButton('explore', (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                ), 'Khám phá')}

                {renderNavButton('pricing', (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ), 'Bảng giá')}
              </nav>
            </div>
          )
        ) : (
          collapsed ? (
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              {renderNavButton('library', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ), 'Study sessions')}

              {renderNavButton('library-shared', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ), 'Shared with me')}

              {renderNavButton('library-folders', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                </svg>
              ), 'Folders')}

              {renderNavButton('explore', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              ), 'Khám phá tài liệu')}

              {renderNavButton('pricing', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ), 'Nâng cấp gói')}

              {renderNavButton('library', (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ), 'Recent')}
            </nav>
          ) : (
            <>
              <div>
                <h4 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, paddingLeft: '8px', marginBottom: '8px' }}>Library</h4>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {renderNavButton('library', (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  ), 'Study sessions')}

                  {renderNavButton('library-shared', (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ), 'Shared with me')}

                  {renderNavButton('library-folders', (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                    </svg>
                  ), 'Folders')}
                </nav>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, paddingLeft: '8px', marginBottom: '8px' }}>Khám phá</h4>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {renderNavButton('explore', (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  ), 'Khám phá tài liệu')}

                  {renderNavButton('pricing', (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ), 'Nâng cấp gói')}
                </nav>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>Recent</h4>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <nav>
                  <button style={{ width: '100%', padding: '8px', background: 'transparent', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Untitled Folder</span>
                  </button>
                </nav>
              </div>
            </>
          )
        )}
      </div>

      {guest ? (
        <div style={{ padding: collapsed ? '12px 8px' : '16px', borderTop: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => onNavigate?.('login')} 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'flex-start', 
              gap: '12px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '8px' 
            }}
            title={collapsed ? "Sign up" : undefined}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            {!collapsed && <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Sign up</span>}
          </button>
        </div>
      ) : (
        <div style={{ padding: collapsed ? '12px 8px' : '16px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          {!collapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-7.88 2.5 2.5 0 0 1 2.46-6.06z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-7.88 2.5 2.5 0 0 0-2.46-6.06z" />
                  </svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }} className="upgrade-title-text">Upgrade for more features</span>
              </div>
              <button onClick={() => onNavigate?.('pricing')} style={{ width: '100%', padding: '10px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}>
                Upgrade
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }} onClick={() => onNavigate?.('pricing')} title="Upgrade">
              <div className="sidebar-upgrade-btn" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #a78bfa, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-7.88 2.5 2.5 0 0 1 2.46-6.06z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-7.88 2.5 2.5 0 0 0-2.46-6.06z" />
                </svg>
              </div>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {showProfileMenu && (
              <>
                <div 
                  onClick={() => setShowProfileMenu(false)} 
                  style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    zIndex: 998, 
                    background: 'transparent' 
                  }} 
                />
                
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    left: collapsed ? '60px' : '0', 
                    width: '224px', 
                    backgroundColor: 'var(--popover-bg, #ffffff)', 
                    borderRadius: '16px', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                    border: '1px solid var(--border-color, #e2e8f0)', 
                    padding: '8px', 
                    marginBottom: '12px', 
                    zIndex: 999, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px' 
                  }}
                  className="profile-popover-menu"
                >
                  <button 
                    onClick={() => { setShowProfileMenu(false); onNavigate?.('settings'); }}
                    className="profile-popover-item"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: '#6366f1' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Settings</span>
                  </button>

                  <button 
                    onClick={() => { setShowProfileMenu(false); onNavigate?.('feature-request'); }}
                    className="profile-popover-item"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: '#6366f1' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                        <circle cx="6" cy="9" r="1" />
                        <circle cx="6" cy="13" r="1" />
                        <circle cx="6" cy="17" r="1" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Feature Request</span>
                  </button>

                  <button 
                    onClick={() => { setShowProfileMenu(false); onNavigate?.('support'); }}
                    className="profile-popover-item"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: '#6366f1' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Support</span>
                  </button>

                  <button 
                    onClick={() => { setShowProfileMenu(false); onNavigate?.('chrome-extension'); }}
                    className="profile-popover-item"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: '#6366f1' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="8" x2="20.75" y2="8" />
                        <line x1="12" y1="16" x2="3.25" y2="16" />
                        <line x1="10" y1="10" x2="5.5" y2="18.5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Chrome Extension Beta</span>
                  </button>

                  <div className="profile-popover-item" style={{ cursor: 'default', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', color: '#6366f1' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2v20M12 12H2a10 10 0 0 0 20 0H12z" />
                        </svg>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>Mode</span>
                    </div>
                    
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleDark(); }} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        backgroundColor: isDark ? '#334155' : '#f1f5f9', 
                        borderRadius: '999px', 
                        padding: '3px', 
                        cursor: 'pointer',
                        position: 'relative',
                        width: '64px',
                        height: '32px',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        userSelect: 'none'
                      }}
                      className="theme-switch-track"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', opacity: isDark ? 0.3 : 1, transition: 'opacity 0.2s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', opacity: isDark ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      </div>
                      <div 
                        style={{ 
                          position: 'absolute',
                          top: '3px',
                          left: isDark ? '35px' : '3px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color, #e2e8f0)', margin: '6px 4px' }} />

                  <button 
                    onClick={() => { setShowProfileMenu(false); onNavigate?.('logout'); }}
                    className="profile-popover-item"
                    style={{ color: '#ef4444' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Logout</span>
                  </button>
                </div>
              </>
            )}

            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)} 
              className="profile-mini-clickable"
              style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '12px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              <img 
                src={user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100"} 
                alt="Avatar" 
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              {!collapsed && (
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.fullName || 'Anh Nhật'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}