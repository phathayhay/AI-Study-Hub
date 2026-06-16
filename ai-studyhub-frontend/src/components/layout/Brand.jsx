import StudyHubIcon from '../icons/StudyHubIcons'

export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="AI Study Hub">
      <span className="brand__mark">
        <StudyHubIcon name="book" size={20} />
      </span>
      <span>
        <strong>AI Study Hub</strong>
        <small>FPT University</small>
      </span>
    </div>
  )
}
