import { useCallback, useEffect, useState } from 'react'
import Badge from '../../../components/ui/Badge'
import { exportAdminActivityLogs, getAdminActivityLogs } from '../../../features/admin/adminService'
import { formatAdminError, unwrapPage } from '../../../features/admin/utils/adminNormalizers'
import { formatDateTime, formatTypeLabel } from '../../../features/admin/utils/adminFormatters'
import { ADMIN_LOG_TYPES } from '../../../features/admin/constants/adminStatus'
import { callToast } from '../../../features/admin/utils/adminActions'
import { AdminNoResults, AdminPagination, AdminSearch, AdminSectionHeader, AdminStatus, AdminTableState } from '../../../features/admin/components/legacyShared'
import { useLanguage } from '../../../context/LanguageContext'

export function AdminLogs() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [state, setState] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
    loading: true,
    error: '',
  })

  const loadLogs = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = await getAdminActivityLogs({
        query,
        type: typeFilter,
        dateFrom,
        dateTo,
        page,
        size: 10,
      })
      const payload = unwrapPage(response)
      setState({
        ...payload,
        loading: false,
        error: '',
      })
    } catch (err) {
      setState((current) => ({
        ...current,
        content: [],
        loading: false,
        error: formatAdminError(err),
      }))
    }
  }, [dateFrom, dateTo, page, query, typeFilter])

  useEffect(() => {
    const timer = window.setTimeout(loadLogs, 120)
    return () => window.clearTimeout(timer)
  }, [loadLogs])

  useEffect(() => {
    setPage(0)
  }, [query, typeFilter, dateFrom, dateTo])

  const handleExport = async () => {
    try {
      const result = await exportAdminActivityLogs({
        query,
        type: typeFilter,
        dateFrom,
        dateTo,
      })
      const url = URL.createObjectURL(result.blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = 'admin-activity-logs.csv'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      callToast('Activity logs exported')
    } catch (err) {
      callToast(err.message || 'Unable to export activity logs', 'error')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card logs-card">
        <AdminSectionHeader icon="trend" title={t('activityLogsTitle')}>
          <div className="admin-toolbar-group">
            <AdminSearch onChange={setQuery} placeholder={t('searchLogsPlaceholder')} value={query} />
            <select className="admin-filter-input" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
              <option value="">{t('allTypes')}</option>
              {ADMIN_LOG_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <div className="admin-date-range" aria-label="Filter by date range">
              <span className="admin-date-range__label">{t('dateRangeLabel')}</span>
              <div className="admin-date-range__field">
                <input
                  aria-label="From date"
                  className="admin-filter-input"
                  onChange={(event) => setDateFrom(event.target.value)}
                  type="date"
                  value={dateFrom}
                />
              </div>
              <span className="admin-date-range__separator" aria-hidden="true">-</span>
              <div className="admin-date-range__field">
                <input
                  aria-label="To date"
                  className="admin-filter-input"
                  onChange={(event) => setDateTo(event.target.value)}
                  type="date"
                  value={dateTo}
                />
              </div>
            </div>
            <button className="admin-primary" onClick={handleExport} type="button">{t('exportCsv')}</button>
          </div>
        </AdminSectionHeader>
        <AdminTableState error={state.error} loading={state.loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('timeHeader')}</th>
              <th>{t('typeHeader')}</th>
              <th>{t('actionHeader')}</th>
              <th>{t('actorHeader')}</th>
              <th>{t('targetHeader')}</th>
              <th>{t('statusHeader')}</th>
            </tr>
          </thead>
          <tbody>
            {state.content.map((item, index) => (
              <tr key={`${item.createdAt}-${item.title}-${index}`}>
                <td>{formatDateTime(item.createdAt)}</td>
                <td><Badge tone="blue">{formatTypeLabel(item.type)}</Badge></td>
                <td>
                  <div className="admin-log-cell">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                </td>
                <td>{item.actor || '-'}</td>
                <td>{item.target || '-'}</td>
                <td><AdminStatus status={item.status} /></td>
              </tr>
            ))}
            {!state.loading && !state.error && state.content.length === 0 && <AdminNoResults colSpan={6} />}
          </tbody>
        </table>
        <AdminPagination
          currentPage={state.page}
          last={state.last}
          onPageChange={setPage}
          totalElements={state.totalElements}
          totalPages={state.totalPages}
        />
      </section>
    </main>
  )
}



export default AdminLogs
