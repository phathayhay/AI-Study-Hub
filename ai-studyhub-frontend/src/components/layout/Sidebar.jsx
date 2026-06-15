import { appUser, guestUser, mainNavItems, publicNavItems } from '../../packages/mooc-data'
import StudyHubIcon from '../icons/StudyHubIcons'
import Brand from './Brand'

export default function Sidebar({ active = 'home', guest = false, onLogout, onNavigate }) {
  const navItems = guest ? publicNavItems : mainNavItems
  const user = guest ? guestUser : appUser

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
            {user.initials}
          </span>
          <span className="profile-mini__text">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        </div>
        {!guest && (
          <button className="logout-button" onClick={onLogout} type="button">
            <StudyHubIcon name="logout" size={20} />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>
    </aside>
  )
}
