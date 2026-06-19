import StudyHubIcon from '../icons/StudyHubIcons'

import logo from '../../assets/logo.png'
import logoCompact from '../../assets/logo-compact.png'

export default function Brand({ compact = false, onClick }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img 
        src={compact ? logoCompact : logo} 
        alt="AI Study Hub" 
        style={{ 
          height: compact ? '32px' : '48px', 
          width: 'auto', 
          objectFit: 'contain'
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

