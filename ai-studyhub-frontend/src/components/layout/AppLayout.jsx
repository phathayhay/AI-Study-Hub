import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({
  active = 'home', children, className = '',
  guest = false, onNavigate, onNotifications, user = null, withTopbar = true, title = null,
  sidebarCollapsed = false, onToggleCollapse
}) {
  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''} ${className}`}>
      <Sidebar 
        active={active} 
        guest={guest} 
        onNavigate={onNavigate} 
        user={user} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <div className="app-shell__body">
        {withTopbar && (
          <Topbar guest={guest} onNavigate={onNavigate} onNotifications={onNotifications} user={user} title={title} active={active} />
        )}
        {children}
      </div>
    </div>
  )
}