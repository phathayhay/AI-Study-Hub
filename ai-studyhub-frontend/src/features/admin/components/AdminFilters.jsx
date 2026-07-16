import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { ADMIN_STATUS_LABELS } from '../constants/adminStatus'

export function AdminSearch({ onChange, placeholder, value }) {
  return (
    <label className="admin-search" role="search">
      <StudyHubIcon name="search" size={18} />
      <input
        aria-label={placeholder || 'Search'}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value ?? ''}
      />
    </label>
  )
}

export function AdminStatusFilter({ onChange, options, value }) {
  return (
    <select aria-label="Filter by status" className="admin-filter-input" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">All statuses</option>
      {options.map((option) => <option key={option} value={option}>{ADMIN_STATUS_LABELS[option] ?? option}</option>)}
    </select>
  )
}

