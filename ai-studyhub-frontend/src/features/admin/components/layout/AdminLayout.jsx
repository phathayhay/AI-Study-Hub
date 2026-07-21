import { useEffect, useState } from 'react'
import StudyHubIcon from '../../../../components/icons/StudyHubIcons'
import Badge from '../../../../components/ui/Badge'
import compactLogo from '../../../../assets/logo-compact.png'
import { adminNavigation as adminNavItems } from '../../constants/adminNavigation'
import { ADMIN_ROUTES } from '../../constants/adminRoutes'
import { useLanguage } from '../../../../context/LanguageContext'
import LanguageSelector from '../../../../components/layout/LanguageSelector'

const adminTranslationMap = {
  [ADMIN_ROUTES.overview]: 'adminOverview',
  [ADMIN_ROUTES.users]: 'adminUsers',
  [ADMIN_ROUTES.documents]: 'adminDocuments',
  [ADMIN_ROUTES.courses]: 'adminCourses',
  [ADMIN_ROUTES.storage]: 'adminStorage',
  [ADMIN_ROUTES.reports]: 'adminReports',
  [ADMIN_ROUTES.logs]: 'adminLogs',
  [ADMIN_ROUTES.settings]: 'adminSettings',
}

export function AdminThemeToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark')
    }
    window.addEventListener('themeChange', handleThemeChange)
    return () => window.removeEventListener('themeChange', handleThemeChange)
  }, [])

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    if (nextIsDark) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
    window.dispatchEvent(new CustomEvent('themeChange'))
  }

  return (
    <button
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="admin-theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? 'Giao diện Tối (Bấm để chuyển sang Sáng)' : 'Giao diện Sáng (Bấm để chuyển sang Tối)'}
      type="button"
    >
      <span className={`admin-theme-icon ${!isDark ? 'active' : ''}`}>
        <svg fill="none" height="15" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="15">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" x2="12" y1="1" y2="3" />
          <line x1="12" x2="12" y1="21" y2="23" />
          <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
          <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
          <line x1="1" x2="3" y1="12" y2="12" />
          <line x1="21" x2="23" y1="12" y2="12" />
          <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
          <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
        </svg>
      </span>
      <span className={`admin-theme-icon ${isDark ? 'active' : ''}`}>
        <svg fill="none" height="15" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="15">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}

export function AdminLayout({ active, children, onNavigate, onLogout }) {
  return (
    <div className="admin-shell">
      <AdminSidebar active={active} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="admin-body">
        <AdminTopbar active={active} />
        {children}
      </div>
    </div>
  )
}

export function AdminSidebar({ active, onNavigate, onLogout }) {
  const { t } = useLanguage()

  return (
    <aside className="admin-sidebar">
      <button
        aria-label="Go to Admin Overview"
        className="admin-brand"
        onClick={() => onNavigate(ADMIN_ROUTES.overview)}
        type="button"
      >
        <img alt="" aria-hidden="true" src={compactLogo} />
        <span><strong>StudyHub Admin</strong><small>{t('controlPanel')}</small></span>
      </button>
      <nav>
        {adminNavItems.map((item) => {
          const translationKey = adminTranslationMap[item.id]
          const label = translationKey ? t(translationKey) : item.label
          return (
            <button
              className={active === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <StudyHubIcon name={item.icon} size={18} />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="admin-profile">
        <span>A</span>
        <div><strong>FPTU Admin</strong><small>admin@fpt.edu.vn</small></div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <StudyHubIcon name="logout" size={18} /> {t('logout')}
      </button>
    </aside>
  )
}

export function AdminTopbar({ active }) {
  const { t } = useLanguage()
  const currentPage = adminNavItems.find((item) => item.id === active)
  const translationKey = currentPage ? adminTranslationMap[currentPage.id] : null
  const currentLabel = translationKey ? t(translationKey) : (currentPage?.label || 'Admin')

  return (
    <header className="admin-topbar">
      <div>
        <strong>{currentLabel}</strong>
        <small>{t('adminWorkspace')}</small>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSelector />
        <AdminThemeToggle />
        <Badge tone="purple">Admin</Badge>
        <strong>FPTU Admin</strong>
      </div>
    </header>
  )
}
