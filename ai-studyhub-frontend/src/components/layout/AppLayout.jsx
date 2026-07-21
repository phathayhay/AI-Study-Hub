import Sidebar from './Sidebar'
import Topbar from './Topbar'
import VerificationBanner from './VerificationBanner'

export default function AppLayout({
  active = 'home', children, className = '',
  guest = false, onNavigate, onNotifications, user = null, withTopbar = true, title = null,
  notificationUnreadCount = 0,
  sidebarCollapsed = false, onToggleCollapse,
  recentItems = [], onOpenRecentItem, activeItemContext = {},
  breadcrumbs = [],
  onBreadcrumbClick,
  onRenameTitle,
  visibility = null,
  route = '',
  onOpenVerification
}) {
  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''} ${className} dark:bg-[#0f172a] text-gray-900 dark:text-white transition-colors duration-300 ease-in-out`}>
      <Sidebar
        active={active}
        guest={guest}
        onNavigate={onNavigate}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        recentItems={recentItems}
        onOpenRecentItem={onOpenRecentItem}
        activeItemContext={activeItemContext}
      />
      <div className="app-shell__body dark:bg-[#0f172a] transition-colors duration-300 ease-in-out">
        <VerificationBanner user={user} onOpenVerification={onOpenVerification} />
        {withTopbar && (
          <Topbar
            guest={guest}
            onNavigate={onNavigate}
            onNotifications={onNotifications}
            notificationUnreadCount={notificationUnreadCount}
            user={user}
            title={title}
            active={active}
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={onBreadcrumbClick}
            onRenameTitle={onRenameTitle}
            visibility={visibility}
            route={route}
          />
        )}
        {children}
      </div>
    </div>
  )
}
