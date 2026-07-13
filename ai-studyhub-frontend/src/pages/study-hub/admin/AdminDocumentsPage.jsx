import { useMemo, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { getDocumentName, formatBytes, formatDate } from '../../../features/admin/utils/adminFormatters'
import { getStatusOptions, matchesSearch, matchesStatus, sortItems } from '../../../features/admin/utils/adminSorters'
import { AdminSectionHeader } from '../../../features/admin/components/AdminSectionHeader'
import { AdminSearch, AdminStatusFilter } from '../../../features/admin/components/AdminFilters'
import { AdminStatus } from '../../../features/admin/components/AdminStatus'
import { AdminResourceState as AdminTableState, AdminNoResults } from '../../../features/admin/components/AdminResourceState'
import { AdminSortableTh } from '../../../features/admin/components/AdminSortableTh'
import { runAdminAction } from '../../../features/admin/utils/adminActions'

import { getAdminDocuments, moderateAdminDocument } from '../../../features/admin/adminService'

export function AdminDocuments() {
  const { data: documents, error, loading, reload } = useAdminList(getAdminDocuments)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')
  const statusOptions = useMemo(() => getStatusOptions(documents, (doc) => doc.moderationStatus, ['pending', 'approved', 'rejected']), [documents])
  const visibleDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      return matchesStatus(statusFilter, doc.moderationStatus) && matchesSearch(query, [
        getDocumentName(doc),
        doc.ownerEmail,
        doc.visibility,
        formatDate(doc.createdAt),
        formatBytes(doc.fileSize),
      ])
    })
    return sortItems(filtered, sortBy, {
      date: (doc) => doc.createdAt,
      name: (doc) => getDocumentName(doc),
      status: (doc) => doc.moderationStatus,
    })
  }, [documents, query, sortBy, statusFilter])

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="file" title="Document Management">
          <AdminStatusFilter onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
          <AdminSearch onChange={setQuery} placeholder="Search documents..." value={query} />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <AdminSortableTh field="name" sortBy={sortBy} onSort={setSortBy}>Title</AdminSortableTh>
              <th>Uploader</th>
              <AdminSortableTh defaultDirection="desc" field="date" sortBy={sortBy} onSort={setSortBy}>Upload Date</AdminSortableTh>
              <th>Size</th>
              <AdminSortableTh field="status" sortBy={sortBy} onSort={setSortBy}>Status</AdminSortableTh>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocuments.map((doc) => (
              <tr key={doc.id || doc.title}>
                <td>{getDocumentName(doc)}</td>
                <td>{doc.ownerEmail || '-'}</td>
                <td>{formatDate(doc.createdAt)}</td>
                <td>{formatBytes(doc.fileSize)}</td>
                <td><AdminStatus status={doc.moderationStatus} /></td>
                <td className="admin-actions">
                  <button onClick={() => runAdminAction(() => moderateAdminDocument(doc.id, 'APPROVED'), reload, 'Document approved')} type="button">
                    <StudyHubIcon name="check" size={16} />
                  </button>
                  <button onClick={() => runAdminAction(() => moderateAdminDocument(doc.id, 'REJECTED'), reload, 'Document rejected')} type="button">
                    <StudyHubIcon name="x" size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !error && visibleDocuments.length === 0 && <AdminNoResults colSpan={6} />}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default AdminDocuments
