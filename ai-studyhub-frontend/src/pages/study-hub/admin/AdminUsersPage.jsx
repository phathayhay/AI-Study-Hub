import { useMemo, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { formatDate, getInitial } from '../../../features/admin/utils/adminFormatters'
import { normalizeStatus } from '../../../features/admin/utils/adminNormalizers'
import { getStatusOptions, matchesSearch, matchesStatus, sortItems } from '../../../features/admin/utils/adminSorters'
import { AdminSectionHeader } from '../../../features/admin/components/AdminSectionHeader'
import { AdminSearch, AdminStatusFilter } from '../../../features/admin/components/AdminFilters'
import { AdminStatus } from '../../../features/admin/components/AdminStatus'
import { AdminResourceState as AdminTableState, AdminNoResults } from '../../../features/admin/components/AdminResourceState'
import { AdminSortableTh } from '../../../features/admin/components/AdminSortableTh'
import { runAdminAction } from '../../../features/admin/utils/adminActions'
import { useLanguage } from '../../../context/LanguageContext'

import { banAdminUser, getAdminUsers, unbanAdminUser } from '../../../features/admin/adminService'

export function AdminUsers({ onOpenUser }) {
  const { t } = useLanguage()
  const { data: users, error, loading, reload } = useAdminList(getAdminUsers)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')
  const statusOptions = useMemo(() => getStatusOptions(users, (user) => user.status, ['active', 'inactive', 'banned']), [users])
  const visibleUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      return matchesStatus(statusFilter, user.status) && matchesSearch(query, [
        user.fullName,
        user.email,
        user.planName,
        formatDate(user.createdAt),
      ])
    })
    return sortItems(filtered, sortBy, {
      date: (user) => user.createdAt,
      name: (user) => user.fullName || user.email,
      status: (user) => user.status,
    })
  }, [query, sortBy, statusFilter, users])

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="users" title={t('userManagement')}>
          <AdminStatusFilter onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
          <AdminSearch onChange={setQuery} placeholder={t('searchUsersPlaceholder')} value={query} />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <AdminSortableTh field="name" sortBy={sortBy} onSort={setSortBy}>{t('tableUser')}</AdminSortableTh>
              <th>{t('tableEmail')}</th>
              <AdminSortableTh defaultDirection="desc" field="date" sortBy={sortBy} onSort={setSortBy}>{t('tableJoined')}</AdminSortableTh>
              <th>{t('tablePlan')}</th>
              <AdminSortableTh field="status" sortBy={sortBy} onSort={setSortBy}>{t('tableStatus')}</AdminSortableTh>
              <th>{t('tableActions')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const banned = normalizeStatus(user.status) === 'banned'
              return (
                <tr key={user.id || user.email}>
                  <td><span className="admin-avatar">{getInitial(user.fullName || user.email)}</span>{user.fullName || '-'}</td>
                  <td>{user.email}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.planName || '-'}</td>
                  <td><AdminStatus status={user.status} /></td>
                  <td className="admin-actions">
                    <button onClick={() => onOpenUser(user)} type="button"><StudyHubIcon name="eye" size={16} /></button>
                    <button
                      onClick={() => runAdminAction(
                        () => (banned ? unbanAdminUser(user.id) : banAdminUser(user.id)),
                        reload,
                        banned ? 'User unbanned' : 'User banned',
                      )}
                      type="button"
                    >
                      <StudyHubIcon name={banned ? 'check' : 'x'} size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && !error && visibleUsers.length === 0 && <AdminNoResults colSpan={6} />}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default AdminUsers
