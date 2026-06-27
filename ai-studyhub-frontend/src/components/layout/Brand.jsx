import compactLogo from '../../assets/logo-compact.png'

export default function Brand({ compact = false, onClick }) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      aria-label="AI Study Hub"
      className={`brand${onClick ? ' brand--interactive' : ''}${compact ? ' brand--compact' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span className="brand__icon-shell" aria-hidden="true">
        <img
          src={compactLogo}
          alt=""
          className="brand__icon-image"
        />
      </span>
      {!compact && (
        <span className="brand__text">
          <strong>AI Study Hub</strong>
          <small>Explore and study smarter</small>
        </span>
      )}
    </Tag>
  )
}

