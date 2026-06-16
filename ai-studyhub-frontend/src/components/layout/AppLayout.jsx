import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({
  active = 'home', children, className = '',
  guest = false, onNavigate, onNotifications, user = null, withTopbar = true,
}) {
  return (
    <div className={`app-shell ${className}`}>
      <Sidebar active={active} guest={guest} onNavigate={onNavigate} user={user} />
      <div className="app-shell__body">
        {withTopbar && (
          <Topbar guest={guest} onNavigate={onNavigate} onNotifications={onNotifications} user={user} />
        )}
        {children}
      </div>
    </div>
  )
}