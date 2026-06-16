import { mainNavItems, publicNavItems } from '../../data/studyHubData'
import StudyHubIcon from '../icons/StudyHubIcons'
import Brand from './Brand'

export default function Sidebar({ active = 'home', guest = false, onNavigate, user }) {
  const navItems = guest ? publicNavItems : mainNavItems
  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : guest ? '?' : 'SV'

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="sidebar__nav" aria-label="Điều hướng chính">
        {navItems.map((item) => (
          <button
            className={`sidebar__link ${active === item.id ? 'is-active' : ''}`}
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            type="button"
          >
            <StudyHubIcon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="profile-mini">
          <span className={`profile-mini__avatar ${guest ? 'profile-mini__avatar--guest' : ''}`}>
            {initials}
          </span>
          <span className="profile-mini__text">
            <strong>{user?.fullName || (guest ? 'Khách' : 'Người dùng')}</strong>
            <small>{user?.email || (guest ? 'Chưa đăng nhập' : '')}</small>
          </span>
        </div>
        {!guest && (
          <button className="logout-button" onClick={() => onNavigate?.('logout')} type="button">
            <StudyHubIcon name="logout" size={20} />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>
    </aside>
  )
}