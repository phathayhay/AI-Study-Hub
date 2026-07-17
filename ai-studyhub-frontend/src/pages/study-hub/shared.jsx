import StudyHubIcon from '../../components/icons/StudyHubIcons'

export function SectionTitle({ count, icon, title }) {
  return <h2 className="inline-section-title"><StudyHubIcon name={icon} size={18} /> {title} <small>({count})</small></h2>
}

export function PageTitle({ centered = false, subtitle, title }) {
  return (
    <header className={`page-title ${centered ? 'page-title--centered' : ''}`}>
      <h1 className="text-slate-900 dark:text-white transition-colors duration-300 ease-in-out">{title}</h1>
      <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300 ease-in-out">{subtitle}</p>
    </header>
  )
}

export function InfoLine({ icon, label, value }) {
  return (
    <div className="info-line">
      <StudyHubIcon name={icon} size={16} />
      <p>
        <small className="text-slate-500 dark:text-slate-400">{label}</small>
        <strong className="text-slate-900 dark:text-white transition-colors duration-300">{value}</strong>
      </p>
    </div>
  )
}

export function InfoBlock({ label, value }) {
  return (
    <p className="info-block">
      <small className="text-slate-500 dark:text-slate-450 transition-colors duration-300">{label}</small>
      <strong className="text-slate-900 dark:text-white transition-colors duration-300">{value}</strong>
    </p>
  )
}
