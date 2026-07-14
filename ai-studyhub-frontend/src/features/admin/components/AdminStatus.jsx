import { ADMIN_STATUS_LABELS } from '../constants/adminStatus'
import { normalizeStatus } from '../utils/adminNormalizers'

export function AdminStatus({ status }) {
  const normalized = normalizeStatus(status)
  const cssStatus = normalized === 'banned' ? 'blocked' : normalized === 'resolved' ? 'approved' : normalized
  return <span className={`admin-status admin-status--${cssStatus}`}>{ADMIN_STATUS_LABELS[normalized] ?? status ?? '-'}</span>
}

