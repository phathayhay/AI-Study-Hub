import StudyHubIcon from '../icons/StudyHubIcons'

export default function SectionHeader({ icon, title, className = '' }) {
  return (
    <div className={`section-header ${className}`}>
      <StudyHubIcon name={icon} size={24} />
      <h2>{title}</h2>
    </div>
  )
}
