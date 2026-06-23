import LogoIcon from '../icons/LogoIcon'

export default function Brand({ compact = false, onClick }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <LogoIcon
        compact={compact}
        className="text-[#050a30] dark:text-white transition-colors duration-300"
        style={{
          height: compact ? '26px' : '34px',
          width: 'auto'
        }}
      />
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', textAlign: 'left' }} aria-label="AI Study Hub">
        {content}
      </button>
    )
  }

  return (
    <div aria-label="AI Study Hub">
      {content}
    </div>
  )
}

