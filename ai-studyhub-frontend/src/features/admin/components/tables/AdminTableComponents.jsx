import StudyHubIcon from '../../../../components/icons/StudyHubIcons'
import { ADMIN_STATUS_LABELS as STATUS_LABELS } from '../../constants/adminStatus'
import { normalizeStatus } from '../../utils/adminNormalizers'
import { getInitial } from '../../utils/adminFormatters'

export function AdminSectionHeader({ children, icon, title }) {
  return <header className="admin-section-header"><h1><StudyHubIcon name={icon} size={28} /> {title}</h1><div>{children}</div></header>
}

export function AdminSearch({ onChange, placeholder, value }) {
  const inputProps = {}
  if (value !== undefined) inputProps.value = value
  if (onChange) inputProps.onChange = (event) => onChange(event.target.value)
  return <label className="admin-search"><StudyHubIcon name="search" size={18} /><input placeholder={placeholder} {...inputProps} /></label>
}

export function AdminStatusFilter({ onChange, options, value }) {
  return (
    <select aria-label="Filter by status" className="admin-filter-input" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">All statuses</option>
      {options.map((option) => <option key={option} value={option}>{STATUS_LABELS[option] ?? option}</option>)}
    </select>
  )
}

export function AdminSortableTh({ children, defaultDirection = 'asc', field, onSort, sortBy }) {
  const [activeField, direction = 'asc'] = sortBy.split(':')
  const active = activeField === field
  const nextDirection = active && direction === 'asc' ? 'desc' : 'asc'
  const nextSort = active ? `${field}:${nextDirection}` : `${field}:${defaultDirection}`

  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className={`admin-sort-header${active ? ' is-active' : ''}`} onClick={() => onSort(nextSort)} type="button">
        <span>{children}</span>
        <span aria-hidden="true" className="admin-sort-arrows">{active ? (direction === 'asc' ? 'â†‘' : 'â†“') : 'â†‘â†“'}</span>
      </button>
    </th>
  )
}

export function AdminTableState({ error, loading }) {
  if (loading) return <p className="admin-empty">Loading admin data...</p>
  if (error) return <p className="admin-empty">{error}</p>
  return null
}

export function AdminNoResults({ colSpan }) {
  return <tr><td className="admin-table-empty" colSpan={colSpan}>No matching records</td></tr>
}

export function AdminPagination({ currentPage, last, onPageChange, totalElements, totalPages }) {
  if (!totalElements) return null
  return (
    <div className="admin-pagination">
      <small>{totalElements} logs</small>
      <div className="admin-pagination-controls">
        <button disabled={currentPage <= 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))} type="button">
          Previous
        </button>
        <span>Page {currentPage + 1} / {Math.max(totalPages, 1)}</span>
        <button disabled={last} onClick={() => onPageChange(currentPage + 1)} type="button">
          Next
        </button>
      </div>
    </div>
  )
}

export function AdminStatus({ status }) {
  const normalized = normalizeStatus(status)
  const cssStatus = normalized === 'banned' ? 'blocked' : normalized === 'resolved' ? 'approved' : normalized
  return <span className={`admin-status admin-status--${cssStatus}`}>{STATUS_LABELS[normalized] ?? status ?? '-'}</span>
}

export function AdminNameCell({ name }) {
  return <span className="admin-name-cell"><span>{getInitial(name)}</span><strong>{name}</strong><small>student@fpt.edu.vn</small></span>
}

export function AdminLogItem({ text, time, title, tone }) {
  return <div className={`admin-log admin-log--${tone}`}><i /><p><strong>{title}</strong><small>{text}</small></p>{time && <span>{time}</span>}</div>
}

export function StorageMetric({ label, sub, tone, value }) {
  return <article className={`storage-metric storage-metric--${tone}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</article>
}


