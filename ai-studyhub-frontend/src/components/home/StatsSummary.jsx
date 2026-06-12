import { stats } from '../../packages/mooc-data'
import StudyHubIcon from '../icons/StudyHubIcons'

export default function StatsSummary() {
  return (
    <section className="stats-grid" aria-label="Thống kê nhanh">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.id}>
          <span className={`stat-card__icon stat-card__icon--${stat.tone}`}>
            <StudyHubIcon name={stat.icon} size={20} />
          </span>
          <span>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </span>
        </article>
      ))}
    </section>
  )
}
