export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="AI Study Hub">
      <img className="brand__logo" src="/app-logo.png" alt="AI Study Hub" />
    </div>
  )
}
