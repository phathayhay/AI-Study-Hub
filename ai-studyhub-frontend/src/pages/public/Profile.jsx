import { useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { appUser, recentActivities } from '../../data/studyHubData'

export function ProfilePage({ user: propUser }) {
  const [localUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const user = propUser || localUser

  return (
    <main className="page-surface profile-page">
      <section className="profile-card">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="profile-avatar" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="profile-avatar">{user?.fullName?.[0] || 'SV'}</div>
        )}
        <div>
          <h1>
            {user?.fullName || appUser.name}{' '}
            <button className="cursor-pointer bg-transparent border-0 inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors" type="button">
              <StudyHubIcon name="edit" size={16} /> Edit
            </button>
          </h1>
          <p><StudyHubIcon name="mail" size={16} /> {user?.email || appUser.email}</p>
          <p><StudyHubIcon name="globe" size={16} /> {appUser.city}</p>
          <p><StudyHubIcon name="calendar" size={16} /> {appUser.joined}</p>
        </div>
      </section>
      <div className="profile-stats">
        {[
          ['upload', '12', 'Uploaded Documents'],
          ['download', '1,234', 'Downloads'],
          ['star', '4.8', 'Average Rating'],
        ].map(([icon, value, label]) => (
          <article key={label}>
            <span><StudyHubIcon name={icon} size={24} /></span>
            <strong>{value}</strong>
            <small>{label}</small>
          </article>
        ))}
      </div>
      <section className="activity-card">
        <h2>Recent Activities</h2>
        {recentActivities.map(([text, time]) => (
          <div className="activity-row" key={text}>
            <span><StudyHubIcon name="user" size={18} /></span>
            <p>{text}<small>{time}</small></p>
          </div>
        ))}
      </section>
    </main>
  )
}
