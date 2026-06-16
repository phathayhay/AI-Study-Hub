export default function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={`badge badge--${tone} ${className}`}>{children}</span>
}
