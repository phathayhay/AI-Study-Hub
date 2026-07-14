import { useMemo } from 'react'
import Badge from '../../../components/ui/Badge'
import { getAdminDocuments } from '../../../features/admin/adminService'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { formatBytes, getDocumentName } from '../../../features/admin/utils/adminFormatters'
import { AdminChart, AdminTableState, StorageMetric } from '../../../features/admin/components/legacyShared'

export function AdminStorage() {
  const { data: documents, error, loading } = useAdminList(getAdminDocuments)
  const totalBytes = documents.reduce((sum, doc) => sum + Number(doc.fileSize || 0), 0)
  const largest = useMemo(() => {
    return [...documents].sort((a, b) => Number(b.fileSize || 0) - Number(a.fileSize || 0)).slice(0, 5)
  }, [documents])

  return (
    <main className="admin-page">
      <AdminTableState error={error} loading={loading} />
      <div className="storage-summary">
        <StorageMetric tone="blue" label="Total Files" value={documents.length} />
        <StorageMetric tone="green" label="Used" value={formatBytes(totalBytes)} />
        <StorageMetric tone="purple" label="Average" value={formatBytes(documents.length ? totalBytes / documents.length : 0)} />
      </div>
      <div className="admin-chart-grid">
        <section className="admin-card storage-bars">
          <h2>Storage Allocation</h2>
          {largest.map((doc) => (
            <div className="storage-row" key={doc.id || doc.fileName}>
              <span>{getDocumentName(doc)}</span>
              <small>{formatBytes(doc.fileSize)}</small>
              <i className="blue" style={{ width: `${Math.max(8, Math.min(100, (Number(doc.fileSize || 0) / Math.max(totalBytes, 1)) * 100))}%` }} />
            </div>
          ))}
        </section>
        <AdminChart title="Usage Trend (30 Days)" type="area" />
      </div>
      <section className="admin-card admin-table-card">
        <h2>Largest Files</h2>
        <table className="admin-table">
          <thead><tr><th>File Name</th><th>Uploader</th><th>Size</th><th>Visibility</th></tr></thead>
          <tbody>
            {largest.map((doc) => (
              <tr key={doc.id || doc.fileName}>
                <td>{getDocumentName(doc)}</td><td>{doc.ownerEmail}</td><td>{formatBytes(doc.fileSize)}</td><td><Badge tone="blue">{doc.visibility || '-'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}



export default AdminStorage
