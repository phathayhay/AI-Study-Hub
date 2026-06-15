import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout({
  active = 'home',
  children,
  className = '',
  guest = false,
  onLogout,
  onNavigate,
  onNotifications,
  withTopbar = true,
}) {
  return (
    <div className={`app-shell ${className}`}>
      <Sidebar active={active} guest={guest} onLogout={onLogout} onNavigate={onNavigate} />
      <div className="app-shell__body">
        {withTopbar && (
          <Topbar guest={guest} onNavigate={onNavigate} onNotifications={onNotifications} />
        )}
        {children}
      </div>
    </div>
  )
}
