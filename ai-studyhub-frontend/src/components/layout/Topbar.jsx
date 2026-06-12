import { appUser } from '../../packages/mooc-data'
import StudyHubIcon from '../icons/StudyHubIcons'

export default function Topbar({ onNotifications, onNavigate, guest = false }) {
  return (
    <header className="topbar">
      {guest ? (
        <div className="topbar__auth">
          <button type="button" onClick={() => onNavigate?.('login')}>Đăng nhập</button>
          <button className="topbar__signup" type="button" onClick={() => onNavigate?.('register')}>
            Đăng ký
          </button>
        </div>
      ) : (
        <div className="topbar__user">
          <button className="notification-button" onClick={onNotifications} type="button" aria-label="Thông báo">
            <StudyHubIcon name="bell" size={20} />
            <span>{appUser.notifications}</span>
          </button>
          <strong>{appUser.name}</strong>
        </div>
      )}
    </header>
  )
}
