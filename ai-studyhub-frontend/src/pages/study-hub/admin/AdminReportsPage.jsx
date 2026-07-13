import { useMemo, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import Badge from '../../../components/ui/Badge'
import { InfoBlock } from '../../../pages/study-hub/shared'
import { getAdminReportDetail, getAdminReports, resolveAdminReport } from '../../../features/admin/adminService'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { formatDate, formatDateTime } from '../../../features/admin/utils/adminFormatters'
import { normalizeStatus, unwrapPayload } from '../../../features/admin/utils/adminNormalizers'
import { getStatusOptions, matchesSearch, matchesStatus, sortItems } from '../../../features/admin/utils/adminSorters'
import { AdminNameCell, AdminNoResults, AdminSectionHeader, AdminSearch, AdminStatus, AdminStatusFilter, AdminSortableTh, AdminTableState } from '../../../features/admin/components/legacyShared'
import { ADMIN_STATUS_LABELS as STATUS_LABELS } from '../../../features/admin/constants/adminStatus'
import { runAdminAction } from '../../../features/admin/utils/adminActions'

export function AdminReports() {
  const { data: reports, error, loading, reload } = useAdminList(getAdminReports)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')
  const [reportModal, setReportModal] = useState(null)
  const [reportDetail, setReportDetail] = useState(null)
  const [reportDetailLoading, setReportDetailLoading] = useState(false)
  const [reportDetailError, setReportDetailError] = useState('')
  const statusOptions = useMemo(() => getStatusOptions(reports, (report) => report.status, ['pending', 'reviewing', 'resolved', 'rejected']), [reports])
  const visibleReports = useMemo(() => {
    const filtered = reports.filter((report) => {
      return matchesStatus(statusFilter, report.status) && matchesSearch(query, [
        report.reporterEmail,
        report.documentTitle,
        report.documentId,
        report.reportType,
        report.reportReason,
        formatDate(report.createdAt),
      ])
    })
    return sortItems(filtered, sortBy, {
      date: (report) => report.createdAt,
      name: (report) => report.documentTitle || `Document #${report.documentId}`,
      status: (report) => report.status,
    })
  }, [query, reports, sortBy, statusFilter])

  const openReportDetail = async (report) => {
    setReportModal(report)
    setReportDetail(null)
    setReportDetailError('')
    setReportDetailLoading(true)
    try {
      const response = await getAdminReportDetail(report.id)
      setReportDetail(unwrapPayload(response))
    } catch (err) {
      setReportDetailError(err.message || 'Unable to load report details')
    } finally {
      setReportDetailLoading(false)
    }
  }

  const closeReportDetail = () => {
    setReportModal(null)
    setReportDetail(null)
    setReportDetailError('')
    setReportDetailLoading(false)
  }

  const openReportedDocument = () => {
    const documentId = reportDetail?.documentId || reportModal?.documentId
    if (!documentId) return
    window.open(`/documents/${documentId}`, '_blank', 'noopener,noreferrer')
  }

  const handleResolveFromModal = async (deleteDocument = false) => {
    const activeReportId = reportDetail?.id || reportModal?.id
    if (!activeReportId) return
    await runAdminAction(
      () => resolveAdminReport(activeReportId, 'RESOLVED', deleteDocument),
      reload,
      deleteDocument ? 'Report resolved and document rejected' : 'Report resolved',
    )
    closeReportDetail()
  }

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="flag" title="Reports">
          <AdminStatusFilter onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
          <AdminSearch onChange={setQuery} placeholder="Search reports..." value={query} />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reporter</th>
              <AdminSortableTh field="name" sortBy={sortBy} onSort={setSortBy}>Document</AdminSortableTh>
              <th>Violation Type</th>
              <AdminSortableTh defaultDirection="desc" field="date" sortBy={sortBy} onSort={setSortBy}>Report Date</AdminSortableTh>
              <AdminSortableTh field="status" sortBy={sortBy} onSort={setSortBy}>Status</AdminSortableTh>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => (
              <tr key={report.id}>
                <td><AdminNameCell name={report.reporterEmail || '-'} /></td>
                <td>{report.documentTitle || `Document #${report.documentId}`}</td>
                <td><Badge tone="orange">{report.reportType || '-'}</Badge></td>
                <td>{formatDate(report.createdAt)}</td>
                <td><AdminStatus status={report.status} /></td>
                <td className="admin-actions">
                  <button onClick={() => openReportDetail(report)} type="button"><StudyHubIcon name="eye" size={15} /></button>
                  <button onClick={() => runAdminAction(() => resolveAdminReport(report.id, 'RESOLVED', false), reload, 'Report resolved')} type="button"><StudyHubIcon name="check" size={15} /></button>
                  <button onClick={() => runAdminAction(() => resolveAdminReport(report.id, 'RESOLVED', true), reload, 'Report resolved and document rejected')} type="button"><StudyHubIcon name="x" size={15} /></button>
                </td>
              </tr>
            ))}
            {!loading && !error && visibleReports.length === 0 && <AdminNoResults colSpan={6} />}
          </tbody>
        </table>
      </section>
      {reportModal && (
        <div className="admin-modal-backdrop" onClick={closeReportDetail}>
          <section className="admin-report-modal" onClick={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" onClick={closeReportDetail} type="button">x</button>
            <div className="admin-report-modal__header">
              <div>
                <h2>Report Details</h2>
                <small>Review the report context before taking action.</small>
              </div>
              <AdminStatus status={reportDetail?.status || reportModal.status} />
            </div>

            {reportDetailLoading && <p className="admin-empty">Loading report details...</p>}
            {!reportDetailLoading && reportDetailError && <p className="admin-empty">{reportDetailError}</p>}
            {!reportDetailLoading && !reportDetailError && (
              <div className="admin-report-modal__body">
                <section className="admin-report-panel">
                  <h3>Report Summary</h3>
                  <div className="admin-report-grid">
                    <InfoBlock label="Reporter" value={reportDetail?.reporterFullName || reportDetail?.reporterEmail || reportModal.reporterEmail || '-'} />
                    <InfoBlock label="Reporter Email" value={reportDetail?.reporterEmail || reportModal.reporterEmail || '-'} />
                    <InfoBlock label="Violation Type" value={reportDetail?.reportType || reportModal.reportType || '-'} />
                    <InfoBlock label="Reported At" value={formatDateTime(reportDetail?.createdAt || reportModal.createdAt)} />
                  </div>
                </section>

                <section className="admin-report-panel">
                  <h3>Reported Document</h3>
                  <div className="admin-report-grid">
                    <InfoBlock label="Title" value={reportDetail?.documentTitle || reportModal.documentTitle || '-'} />
                    <InfoBlock label="Document ID" value={reportDetail?.documentId || reportModal.documentId || '-'} />
                    <InfoBlock label="Uploader" value={reportDetail?.documentOwnerEmail || '-'} />
                    <InfoBlock label="Course" value={reportDetail?.courseCode ? `${reportDetail.courseCode}${reportDetail.courseName ? ` - ${reportDetail.courseName}` : ''}` : (reportDetail?.courseName || '-')} />
                    <InfoBlock label="Visibility" value={reportDetail?.documentVisibility || '-'} />
                    <InfoBlock label="Moderation" value={reportDetail?.documentModerationStatus || '-'} />
                    <InfoBlock label="Reports on this document" value={reportDetail?.documentReportCount ?? '-'} />
                    <InfoBlock label="Uploaded At" value={formatDateTime(reportDetail?.documentCreatedAt)} />
                  </div>
                </section>

                <section className="admin-report-panel">
                  <h3>Reporter Note</h3>
                  <div className="admin-report-reason">
                    {reportDetail?.reportReason || reportModal.reportReason || 'No explanation provided by the reporter.'}
                  </div>
                </section>
              </div>
            )}

            <footer className="admin-report-modal__footer">
              <button className="admin-secondary" onClick={openReportedDocument} type="button">
                Open Document
              </button>
              <div className="admin-verification-actions">
                <button onClick={() => handleResolveFromModal(false)} type="button">Resolve</button>
                <button className="danger" onClick={() => handleResolveFromModal(true)} type="button">Reject Document</button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}

export function AdminReportModal({ onClose, report }) {
  const documentTitle = report.documentTitle || `Document #${report.documentId || '-'}`

  return (
    <div className="admin-modal-backdrop">
      <section className="admin-report-modal">
        <button aria-label="Close report details" className="admin-modal-close" onClick={onClose} type="button">x</button>
        <header>
          <span><StudyHubIcon name="flag" size={22} /></span>
          <div>
            <h2>Report Details</h2>
            <p>{documentTitle}</p>
          </div>
        </header>
        <div className="admin-detail-grid">
          <InfoBlock label="Reporter" value={report.reporterEmail || '-'} />
          <InfoBlock label="Document" value={documentTitle} />
          <InfoBlock label="Violation Type" value={report.reportType || '-'} />
          <InfoBlock label="Report Date" value={formatDate(report.createdAt)} />
          <InfoBlock label="Status" value={STATUS_LABELS[normalizeStatus(report.status)] || report.status || '-'} />
          <p className="info-block admin-report-reason">
            <small>Reason</small>
            <strong>{report.reportReason || 'No reason provided'}</strong>
          </p>
        </div>
        <footer>
          <button className="dark-button" onClick={onClose} type="button">Close</button>
        </footer>
      </section>
    </div>
  )
}

export function AdminReportConfirmModal({ action, onCancel, onConfirm }) {
  const { rejectDocument, report } = action
  const documentTitle = report.documentTitle || `Document #${report.documentId || '-'}`

  return (
    <div className="admin-modal-backdrop">
      <section className="admin-report-modal admin-report-modal--confirm">
        <button aria-label="Cancel report action" className="admin-modal-close" onClick={onCancel} type="button">x</button>
        <header>
          <span className={rejectDocument ? 'red' : 'green'}><StudyHubIcon name={rejectDocument ? 'x' : 'check'} size={22} /></span>
          <div>
            <h2>{rejectDocument ? 'Reject Document' : 'Resolve Report'}</h2>
            <p>{documentTitle}</p>
          </div>
        </header>
        <div className="admin-report-summary">
          <p><strong>Reporter:</strong> {report.reporterEmail || '-'}</p>
          <p><strong>Violation:</strong> {report.reportType || '-'}</p>
          <p><strong>Reason:</strong> {report.reportReason || 'No reason provided'}</p>
        </div>
        <p className="admin-report-warning">
          {rejectDocument
            ? 'This will mark the report as resolved and reject the reported document.'
            : 'This will mark the report as resolved without rejecting the document.'}
        </p>
        <footer>
          <button className="dark-button" onClick={onCancel} type="button">Cancel</button>
          <button className={rejectDocument ? 'admin-danger' : 'admin-primary'} onClick={onConfirm} type="button">
            {rejectDocument ? 'Reject document' : 'Resolve report'}
          </button>
        </footer>
      </section>
    </div>
  )
}



export default AdminReports
