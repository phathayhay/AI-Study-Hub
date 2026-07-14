import StudyHubIcon from '../../../../components/icons/StudyHubIcons'
import Badge from '../../../../components/ui/Badge'
import { adminNavigation as adminNavItems } from '../../constants/adminNavigation'

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
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img alt="StudyHub Admin" src="/images/Thiáº¿t káº¿ chÆ°a cĂ³ tĂªn.png" />
        <span><strong>StudyHub Admin</strong><small>Control Panel</small></span>
      </div>
      <nav>
        {adminNavItems.map((item) => (
          <button
            className={active === item.id ? 'is-active' : ''}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <StudyHubIcon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="admin-profile">
        <span>A</span>
        <div><strong>FPTU Admin</strong><small>admin@fpt.edu.vn</small></div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <StudyHubIcon name="logout" size={18} /> Log Out
      </button>
    </aside>
  )
}

export function AdminTopbar({ active }) {
  const currentPage = adminNavItems.find((item) => item.id === active)

  return (
    <header className="admin-topbar">
      <div>
        <strong>{currentPage?.label || 'Admin'}</strong>
        <small>Manage StudyHub workspace</small>
      </div>
      <div>
        <Badge tone="purple">Admin</Badge>
        <strong>FPTU Admin</strong>
      </div>
    </header>
  )
}


