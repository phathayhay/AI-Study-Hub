import { useCallback, useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import {
  banAdminUser,
  createAdminCourse,
  createAdminMajor,
  createAdminPlan,
  deleteAdminCourse,
  deleteAdminMajor,
  deleteAdminPlan,
  getAdminCategories,
  getAdminActivityLogs,
  getAdminCourses,
  getAdminDashboardData,
  getAdminDocuments,
  getAdminMajors,
  getAdminPlans,
  getAdminReports,
  getAdminUsers,
  getPendingVerifications,
  moderateAdminDocument,
  resolveAdminReport,
  reviewVerification,
  unbanAdminUser,
  updateAdminCourse,
  updateAdminMajor,
  updateAdminPlan,
  exportAdminActivityLogs,
} from '../../features/admin/adminService'
import { adminNavItems } from './config'
import { InfoBlock } from './shared'

const callToast = (message, tone = 'success') => {
  if (window.showToast) window.showToast(message, tone)
}

const unwrapList = (response) => {
  const data = response?.data ?? response
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  return []
}

const unwrapPayload = (response) => response?.data ?? response ?? null
const unwrapPage = (response) => {
  const data = unwrapPayload(response)
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || 0),
    size: Number(data?.size || 10),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
    last: Boolean(data?.last),
  }
}

const formatAdminError = (err) => {
  const target = err.path ? `${err.method || 'GET'} ${err.path}` : 'admin data'
  if (err.status >= 500) return `Server error while loading ${target}. Please check the backend logs.`
  if (err.status === 403) return `You do not have permission to load ${target}. Please sign in with an admin account.`
  if (err.status === 401) return `Your session expired while loading ${target}. Please sign in again.`
  return err.message || 'Unable to load admin data'
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN')
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatBytes = (value = 0) => {
  if (!value) return '0 MB'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(value)
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const normalizeStatus = (value) => String(value || 'pending').toLowerCase()
const getInitial = (value = 'A') => value.trim().charAt(0).toUpperCase() || 'A'
const getDocumentName = (doc = {}) => doc.title || doc.fileName || 'Untitled'
const CHART_PALETTE = ['#2563eb', '#0f766e', '#ea580c', '#16a34a', '#f59e0b', '#7c3aed', '#64748b']
const ADMIN_LOG_TYPES = [
  ['user', 'Users'],
  ['document', 'Documents'],
  ['download', 'Downloads'],
  ['report', 'Reports'],
  ['ai', 'AI'],
]
const STATUS_LABELS = {
  active: 'Active',
  banned: 'Banned',
  blocked: 'Banned',
  suspended: 'Suspended',
  inactive: 'Inactive',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  resolved: 'Resolved',
  success: 'Success',
  started: 'Started',
}

const normalizeText = (value) => String(value || '').toLowerCase()
const matchesSearch = (query, values) => {
  const term = normalizeText(query).trim()
  if (!term) return true
  return values.some((value) => normalizeText(value).includes(term))
}
const matchesStatus = (selected, status) => !selected || normalizeStatus(status) === selected
const compareText = (left, right) => String(left || '').localeCompare(String(right || ''), 'vi', { sensitivity: 'base' })
const formatTypeLabel = (value) => ADMIN_LOG_TYPES.find(([type]) => type === value)?.[1] || String(value || 'All')
const compareDate = (left, right) => {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0
  return (Number.isNaN(leftTime) ? 0 : leftTime) - (Number.isNaN(rightTime) ? 0 : rightTime)
}

function getStatusOptions(items, readStatus, defaults = []) {
  const options = new Set(defaults)
  items.forEach((item) => {
    const status = readStatus(item)
    if (status) options.add(normalizeStatus(status))
  })
  return [...options]
}

function sortItems(items, sortValue, readers) {
  const [field, direction = 'asc'] = sortValue.split(':')
  const multiplier = direction === 'desc' ? -1 : 1
  return [...items].sort((left, right) => {
    if (field === 'date') return compareDate(readers.date(left), readers.date(right)) * multiplier
    if (field === 'status') return compareText(normalizeStatus(readers.status(left)), normalizeStatus(readers.status(right))) * multiplier
    return compareText(readers.name(left), readers.name(right)) * multiplier
  })
}

function useAdminList(loader) {
  const [state, setState] = useState({ data: [], error: '', loading: true })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, error: '', loading: true }))
    try {
      const response = await loader()
      setState({ data: unwrapList(response), error: '', loading: false })
    } catch (err) {
      setState({ data: [], error: formatAdminError(err), loading: false })
    }
  }, [loader])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return { ...state, reload: load }
}

async function runAdminAction(action, refresh, successMessage) {
  try {
    await action()
    callToast(successMessage)
    await refresh?.()
  } catch (err) {
    callToast(err.message || 'Admin action failed', 'error')
  }
}

export function AdminApp({ route, onNavigate, onLogout }) {
  const [userModal, setUserModal] = useState(null)
  const [courseModal, setCourseModal] = useState(null)

  return (
    <AdminLayout active={route} onNavigate={onNavigate} onLogout={onLogout}>
      {route === 'admin-overview' && <AdminOverview onOpenUser={setUserModal} />}
      {route === 'admin-users' && <AdminUsers onOpenUser={setUserModal} />}
      {route === 'admin-documents' && <AdminDocuments />}
      {route === 'admin-courses' && <AdminCourses onEdit={setCourseModal} />}
      {route === 'admin-storage' && <AdminStorage />}
      {route === 'admin-reports' && <AdminReports />}
      {route === 'admin-logs' && <AdminLogs />}
      {route === 'admin-settings' && <AdminSettings />}
      {userModal && <AdminUserModal user={userModal} onClose={() => setUserModal(null)} />}
      {courseModal && (
        <AdminCourseModal
          course={courseModal.course}
          mode={courseModal.mode}
          onClose={() => setCourseModal(null)}
          onSaved={courseModal.onSaved}
        />
      )}
    </AdminLayout>
  )
}

function AdminLayout({ active, children, onNavigate, onLogout }) {
  return (
    <div className="admin-shell">
      <AdminSidebar active={active} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="admin-body">
        <AdminTopbar active={active} />
        {children}
      </div>
    </div>
  )
}

function AdminSidebar({ active, onNavigate, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img alt="StudyHub Admin" src="/images/Thiết kế chưa có tên.png" />
        <span><strong>StudyHub Admin</strong><small>Control Panel</small></span>
      </div>
      <nav>
        {adminNavItems.map((item) => (
          <button
            className={active === item.id ? 'is-active' : ''}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <StudyHubIcon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="admin-profile">
        <span>A</span>
        <div><strong>FPTU Admin</strong><small>admin@fpt.edu.vn</small></div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <StudyHubIcon name="logout" size={18} /> Log Out
      </button>
    </aside>
  )
}

function AdminTopbar({ active }) {
  const currentPage = adminNavItems.find((item) => item.id === active)

  return (
    <header className="admin-topbar">
      <div>
        <strong>{currentPage?.label || 'Admin'}</strong>
        <small>Manage StudyHub workspace</small>
      </div>
      <div>
        <Badge tone="purple">Admin</Badge>
        <strong>FPTU Admin</strong>
      </div>
    </header>
  )
}

function AdminOverview({ onOpenUser }) {
  const [state, setState] = useState({ data: null, error: '', loading: true })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await getAdminDashboardData()
        if (cancelled) return
        setState({
          data: {
            users: unwrapList(response.users),
            documents: unwrapList(response.documents),
            reports: unwrapList(response.reports),
            verifications: unwrapList(response.verifications),
            plans: unwrapList(response.plans),
            majors: unwrapList(response.majors),
            courses: unwrapList(response.courses),
            categories: unwrapList(response.categories),
            analytics: unwrapPayload(response.analytics),
          },
          error: '',
          loading: false,
        })
      } catch (err) {
        if (!cancelled) setState({ data: null, error: err.message || 'Unable to load dashboard', loading: false })
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const data = state.data || {}
  const users = data.users || []
  const documents = data.documents || []
  const reports = data.reports || []
  const analytics = data.analytics || {}
  const recentUsers = analytics.recentUsers || users.slice(0, 3)
  const activities = analytics.activities || []
  const pendingDocs = documents.filter((doc) => normalizeStatus(doc.moderationStatus) === 'pending')
  const totalStorage = documents.reduce((sum, doc) => sum + Number(doc.fileSize || 0), 0)

  return (
    <main className="admin-page admin-page--dashboard">
      <AdminTableState error={state.error} loading={state.loading} />
      <div className="admin-stat-grid">
        {[
          ['users', users.length, 'Total Users', `${data.verifications?.length || 0} pending`, 'users'],
          ['documents', documents.length, 'Total Documents', `${pendingDocs.length} pending`, 'file'],
          ['reports', reports.length, 'Reports', `${reports.filter((r) => normalizeStatus(r.status) === 'pending').length} pending`, 'flag'],
          ['storage', formatBytes(totalStorage), 'Stored Files', `${data.courses?.length || 0} courses`, 'archive'],
        ].map(([id, value, label, change, icon]) => (
          <article className="admin-stat-card" key={id}>
            <span><StudyHubIcon name={icon} size={22} /></span>
            <small>{change}</small>
            <strong>{value}</strong>
            <p>{label}</p>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-panels">
        <section className="admin-card recent-users">
          <h2><StudyHubIcon name="users" size={20} /> New Users</h2>
          {recentUsers.map((user) => (
            <button className="admin-user-mini" key={user.id || user.email} onClick={() => onOpenUser(user)} type="button">
              <span>{getInitial(user.fullName || user.email)}</span>
              <p><strong>{user.fullName || user.email}</strong><small>{user.email}</small></p>
              <AdminStatus status={user.status} />
              <StudyHubIcon name="eye" size={15} />
            </button>
          ))}
          {!state.loading && !state.error && recentUsers.length === 0 && <p className="admin-empty">No recent users yet.</p>}
        </section>
        <section className="admin-card system-activity">
          <h2><StudyHubIcon name="trend" size={18} /> System Activities</h2>
          {activities.map((activity, index) => (
            <AdminLogItem
              key={`${activity.title}-${activity.createdAt || index}`}
              text={activity.text}
              time={formatDateTime(activity.createdAt)}
              title={activity.title}
              tone={activity.tone || 'blue'}
            />
          ))}
          {!state.loading && !state.error && activities.length === 0 && <p className="admin-empty">No system activity available yet.</p>}
        </section>
      </div>
      <div className="admin-chart-grid">
        <AdminChart
          title="Upload/Download Trends"
          type="dual-bars"
          data={analytics.uploadTrends || []}
          secondaryData={analytics.downloadTrends || []}
          summary="Last 7 days"
          primaryLabel="Uploads"
          secondaryLabel="Downloads"
        />
        <AdminChart
          title="Document Distribution by Subject"
          type="pie"
          data={analytics.documentDistribution || []}
          summary="Documents by subject"
        />
        <AdminChart
          title="Active Users by Day"
          type="bars"
          data={analytics.activeUsersByDay || []}
          summary="Unique active users in the last 7 days"
          primaryLabel="Active users"
        />
        <AdminChart
          title="AI Chat Usage (24h)"
          type="curve"
          data={analytics.aiChatUsage24h || []}
          summary="AI replies generated in the last 24 hours"
          primaryLabel="AI messages"
        />
      </div>
    </main>
  )
}

function AdminUsers({ onOpenUser }) {
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
        <AdminSectionHeader icon="users" title="User Management">
          <AdminStatusFilter onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
          <AdminSearch onChange={setQuery} placeholder="Search users..." value={query} />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <AdminSortableTh field="name" sortBy={sortBy} onSort={setSortBy}>User</AdminSortableTh>
              <th>Email</th>
              <AdminSortableTh defaultDirection="desc" field="date" sortBy={sortBy} onSort={setSortBy}>Joined</AdminSortableTh>
              <th>Plan</th>
              <AdminSortableTh field="status" sortBy={sortBy} onSort={setSortBy}>Status</AdminSortableTh>
              <th>Actions</th>
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

function AdminDocuments() {
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

function AdminCourses({ onEdit }) {
  const { data: courses, error, loading, reload } = useAdminList(getAdminCourses)

  return (
    <main className="admin-page">
      <section className="admin-card admin-course-card">
        <AdminSectionHeader icon="book" title="Subject Management">
          <button className="admin-primary" onClick={() => onEdit({ mode: 'add', onSaved: reload })} type="button">
            <StudyHubIcon name="plus" size={18} /> Add Subject
          </button>
        </AdminSectionHeader>
        <div className="admin-search-row">
          <AdminSearch placeholder="Search subjects..." />
          <input placeholder="Major" />
        </div>
        <AdminTableState error={error} loading={loading} />
        <div className="course-grid">
          {courses.map((course) => (
            <article className="course-card" key={course.id || course.courseCode}>
              <div>
                <h3>{course.courseCode}</h3>
                <p>{course.courseName}</p>
              </div>
              <div className="course-actions">
                <button onClick={() => onEdit({ mode: 'edit', course, onSaved: reload })} type="button"><StudyHubIcon name="edit" size={16} /></button>
                <button onClick={() => runAdminAction(() => deleteAdminCourse(course.id), reload, 'Course deleted')} type="button">
                  <StudyHubIcon name="archive" size={16} />
                </button>
              </div>
              <div><Badge tone="purple">{course.isActive ? 'Active' : 'Inactive'}</Badge><Badge tone="blue">{course.major?.majorCode || 'Major'}</Badge></div>
              <footer><span>{course.description || 'No description'}</span></footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function AdminStorage() {
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

function AdminReports() {
  const { data: reports, error, loading, reload } = useAdminList(getAdminReports)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('date:desc')
  const [detailReport, setDetailReport] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const statusOptions = useMemo(() => getStatusOptions(reports, (report) => report.status, ['pending', 'resolved']), [reports])
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

  const handleResolveReport = async () => {
    if (!confirmAction?.report) return
    const { rejectDocument, report } = confirmAction
    await runAdminAction(
      () => resolveAdminReport(report.id, 'RESOLVED', rejectDocument),
      reload,
      rejectDocument ? 'Report resolved and document rejected' : 'Report marked as resolved',
    )
    setConfirmAction(null)
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
                  <button aria-label="View report details" onClick={() => setDetailReport(report)} title="View report details" type="button"><StudyHubIcon name="eye" size={15} /></button>
                  <button aria-label="Resolve report only" onClick={() => setConfirmAction({ rejectDocument: false, report })} title="Resolve report only" type="button"><StudyHubIcon name="check" size={15} /></button>
                  <button aria-label="Resolve and reject document" onClick={() => setConfirmAction({ rejectDocument: true, report })} title="Resolve and reject document" type="button"><StudyHubIcon name="x" size={15} /></button>
                </td>
              </tr>
            ))}
            {!loading && !error && visibleReports.length === 0 && <AdminNoResults colSpan={6} />}
          </tbody>
        </table>
      </section>
      {detailReport && <AdminReportModal report={detailReport} onClose={() => setDetailReport(null)} />}
      {confirmAction && (
        <AdminReportConfirmModal
          action={confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleResolveReport}
        />
      )}
    </main>
  )
}

function AdminReportModal({ onClose, report }) {
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

function AdminReportConfirmModal({ action, onCancel, onConfirm }) {
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

function AdminLogs() {
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
        <AdminSectionHeader icon="trend" title="Activity Logs">
          <div className="admin-toolbar-group">
            <AdminSearch onChange={setQuery} placeholder="Search logs..." value={query} />
            <select className="admin-filter-input" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}>
              <option value="">All types</option>
              {ADMIN_LOG_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input className="admin-filter-input" onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
            <input className="admin-filter-input" onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} />
            <button className="admin-primary" onClick={handleExport} type="button">Export CSV</button>
          </div>
        </AdminSectionHeader>
        <AdminTableState error={state.error} loading={state.loading} />
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
              <th>Status</th>
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

function AdminSettings() {
  const plans = useAdminList(getAdminPlans)
  const majors = useAdminList(getAdminMajors)
  const verifications = useAdminList(getPendingVerifications)

  return (
    <main className="admin-page settings-page">
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="sparkle" size={18} /> Lookup Config</h2>
        <LookupRows
          fields={['majorCode', 'majorName', 'description']}
          items={majors.data}
          labelKey="majorName"
          loading={majors.loading}
          onCreate={() => createLookup('major', majors.reload)}
          onDelete={(item) => runAdminAction(() => deleteAdminMajor(item.id), majors.reload, 'Major deleted')}
          onUpdate={(item) => updateLookup('major', item, majors.reload)}
          title="Majors"
        />
        <LookupRows
          fields={['planName', 'price', 'storageLimitMb', 'aiRequestsPerDay']}
          items={plans.data}
          labelKey="planName"
          loading={plans.loading}
          onCreate={() => createLookup('plan', plans.reload)}
          onDelete={(item) => runAdminAction(() => deleteAdminPlan(item.id), plans.reload, 'Plan deleted')}
          onUpdate={(item) => updateLookup('plan', item, plans.reload)}
          title="Plans"
        />
      </section>
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="lock" size={18} /> Pending Verifications</h2>
        <AdminTableState error={verifications.error} loading={verifications.loading} />
        {verifications.data.map((item) => (
          <div className="setting-row" key={item.id}>
            <p><strong>{item.fullName || item.userEmail || `Request #${item.id}`}</strong><small>{item.studentCode || item.reviewNote || 'Student verification'}</small></p>
            <span className="admin-actions">
              <button onClick={() => runAdminAction(() => reviewVerification(item.id, 'APPROVED', 'Approved by admin'), verifications.reload, 'Verification approved')} type="button"><StudyHubIcon name="check" size={16} /></button>
              <button onClick={() => runAdminAction(() => reviewVerification(item.id, 'REJECTED', 'Rejected by admin'), verifications.reload, 'Verification rejected')} type="button"><StudyHubIcon name="x" size={16} /></button>
            </span>
          </div>
        ))}
      </section>
    </main>
  )
}

async function createLookup(type, reload) {
  const body = promptLookup(type)
  if (!body) return
  const actions = {
    major: () => createAdminMajor(body),
    plan: () => createAdminPlan(body),
  }
  await runAdminAction(actions[type], reload, `${type} created`)
}

async function updateLookup(type, item, reload) {
  const body = promptLookup(type, item)
  if (!body) return
  const actions = {
    major: () => updateAdminMajor(item.id, body),
    plan: () => updateAdminPlan(item.id, body),
  }
  await runAdminAction(actions[type], reload, `${type} updated`)
}

function promptLookup(type, item = {}) {
  if (type === 'major') {
    const majorCode = window.prompt('Major code', item.majorCode || '')
    if (!majorCode) return null
    const majorName = window.prompt('Major name', item.majorName || '')
    if (!majorName) return null
    const description = window.prompt('Description', item.description || '') || ''
    return { majorCode, majorName, description }
  }
  const planName = window.prompt('Plan name', item.planName || '')
  if (!planName) return null
  return {
    planName,
    description: window.prompt('Description', item.description || '') || '',
    price: Number(window.prompt('Price', item.price ?? 0)),
    storageLimitMb: Number(window.prompt('Storage limit MB', item.storageLimitMb ?? 1024)),
    aiRequestsPerDay: Number(window.prompt('AI requests per day', item.aiRequestsPerDay ?? 10)),
    isActive: item.isActive ?? true,
  }
}

function LookupRows({ fields, items, labelKey, loading, onCreate, onDelete, onUpdate, title }) {
  return (
    <div className="setting-row lookup-row">
      <p className="lookup-summary"><strong>{title}</strong><small>{loading ? 'Loading...' : `${items.length} records`}</small></p>
      <span className="admin-actions lookup-create">
        <button onClick={onCreate} type="button"><StudyHubIcon name="plus" size={16} /></button>
      </span>
      <div className="lookup-list">
        {items.map((item) => (
          <p className="lookup-item" key={item.id || item[labelKey]}>
            <strong>{item[labelKey]}</strong>
            <small>{fields.map((field) => item[field]).filter(Boolean).join(' - ')}</small>
            <span className="admin-actions">
              <button onClick={() => onUpdate(item)} type="button"><StudyHubIcon name="edit" size={16} /></button>
              <button onClick={() => onDelete(item)} type="button"><StudyHubIcon name="archive" size={16} /></button>
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}

function AdminChart({ title, type, data = [], secondaryData = [], summary, primaryLabel, secondaryLabel }) {
  const normalizedData = type === 'curve' ? compressHourlyUsage(data) : data
  const hasData = normalizedData.length > 0 && normalizedData.some((item) => Number(item?.value || 0) > 0)
  const hasSecondary = secondaryData.length > 0 && secondaryData.some((item) => Number(item?.value || 0) > 0)

  return (
    <section className={`admin-card admin-chart admin-chart--${type}`}>
      <h2>{title}</h2>
      {type === 'pie' ? (
        hasData ? <AdminPieChart data={normalizedData} /> : <p className="admin-empty">No chart data yet.</p>
      ) : type === 'dual-bars' ? (
        hasData || hasSecondary ? (
          <AdminDualBarChart
            data={normalizedData}
            primaryLabel={primaryLabel}
            secondaryData={secondaryData}
            secondaryLabel={secondaryLabel}
          />
        ) : (
          <p className="admin-empty">No chart data yet.</p>
        )
      ) : hasData ? (
        <AdminBarChart data={normalizedData} tone={type === 'curve' ? 'teal' : type === 'bars' ? 'purple' : 'blue'} />
      ) : (
        <p className="admin-empty">No chart data yet.</p>
      )}
      <small>{summary || (type === 'pie' ? 'Courses and categories' : 'Live admin summary')}</small>
    </section>
  )
}

function AdminBarChart({ data, tone = 'blue' }) {
  const maxValue = Math.max(...data.map((item) => Number(item?.value || 0)), 1)
  return (
    <div className={`fake-chart fake-chart--${tone}`}>
      {data.map((item, index) => {
        const value = Number(item?.value || 0)
        const showLabel = data.length <= 8 || index % Math.ceil(data.length / 8) === 0 || index === data.length - 1
        return (
        <div className="fake-chart-group" key={item.label}>
          <span
            className={`fake-chart-bar${value === 0 ? ' is-zero' : ''}`}
            style={{ height: `${value === 0 ? 0 : Math.max(10, (value / maxValue) * 100)}%` }}
          />
          <strong>{Number(item?.value || 0)}</strong>
          <small>{showLabel ? item.label : ''}</small>
        </div>
      )})}
    </div>
  )
}

function compressHourlyUsage(data) {
  if (!Array.isArray(data) || data.length <= 8) return data
  const groups = []
  for (let index = 0; index < data.length; index += 4) {
    const slice = data.slice(index, index + 4)
    const firstLabel = slice[0]?.label || ''
    const lastLabel = slice[slice.length - 1]?.label || ''
    const compactFirst = firstLabel.slice(0, 2)
    const compactLast = lastLabel.slice(0, 2)
    groups.push({
      label: `${compactFirst}-${compactLast}`,
      value: slice.reduce((sum, item) => sum + Number(item?.value || 0), 0),
    })
  }
  return groups
}

function AdminDualBarChart({ data, primaryLabel, secondaryData, secondaryLabel }) {
  const labels = [...new Set([...data.map((item) => item.label), ...secondaryData.map((item) => item.label)])]
  const primaryMap = new Map(data.map((item) => [item.label, Number(item?.value || 0)]))
  const secondaryMap = new Map(secondaryData.map((item) => [item.label, Number(item?.value || 0)]))
  const merged = labels.map((label) => ({
    label,
    primary: primaryMap.get(label) || 0,
    secondary: secondaryMap.get(label) || 0,
  }))
  const maxValue = Math.max(
    ...merged.flatMap((item) => [item.primary, item.secondary]),
    1,
  )

  return (
    <>
      <div className="admin-chart-legend">
        <span><i className="legend-swatch legend-swatch--blue" /> {primaryLabel || 'Primary'}</span>
        <span><i className="legend-swatch legend-swatch--teal" /> {secondaryLabel || 'Secondary'}</span>
      </div>
      <div className="fake-chart fake-chart--dual">
        {merged.map((item, index) => {
          const showLabel = merged.length <= 8 || index % Math.ceil(merged.length / 8) === 0 || index === merged.length - 1
          return (
          <div className="fake-chart-group fake-chart-group--dual" key={item.label}>
            <div className="fake-chart-pair">
              <span
                className={`fake-chart-bar fake-chart-bar--blue${item.primary === 0 ? ' is-zero' : ''}`}
                style={{ height: `${item.primary === 0 ? 0 : Math.max(10, (item.primary / maxValue) * 100)}%` }}
              />
              <span
                className={`fake-chart-bar fake-chart-bar--teal${item.secondary === 0 ? ' is-zero' : ''}`}
                style={{ height: `${item.secondary === 0 ? 0 : Math.max(10, (item.secondary / maxValue) * 100)}%` }}
              />
            </div>
            <strong>{item.primary}/{item.secondary}</strong>
            <small>{showLabel ? item.label : ''}</small>
          </div>
        )})}
      </div>
    </>
  )
}

function AdminPieChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item?.value || 0), 0)
  let offset = 0
  const gradient = data
    .map((item, index) => {
      const value = Number(item?.value || 0)
      const start = offset
      offset += total > 0 ? (value / total) * 100 : 0
      const color = CHART_PALETTE[index % CHART_PALETTE.length]
      return `${color} ${start}% ${offset}%`
    })
    .join(', ')

  return (
    <div className="admin-pie-wrap">
      <div className="fake-pie" style={{ background: total > 0 ? `conic-gradient(${gradient})` : undefined }} />
      <div className="admin-pie-legend">
        {data.map((item, index) => (
          <div className="admin-pie-legend-item" key={item.label}>
            <span><i className="legend-swatch" style={{ background: CHART_PALETTE[index % CHART_PALETTE.length] }} /> {item.label}</span>
            <strong>{Number(item?.value || 0)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSectionHeader({ children, icon, title }) {
  return <header className="admin-section-header"><h1><StudyHubIcon name={icon} size={28} /> {title}</h1><div>{children}</div></header>
}

function AdminSearch({ onChange, placeholder, value }) {
  const inputProps = {}
  if (value !== undefined) inputProps.value = value
  if (onChange) inputProps.onChange = (event) => onChange(event.target.value)
  return <label className="admin-search"><StudyHubIcon name="search" size={18} /><input placeholder={placeholder} {...inputProps} /></label>
}

function AdminStatusFilter({ onChange, options, value }) {
  return (
    <select aria-label="Filter by status" className="admin-filter-input" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">All statuses</option>
      {options.map((option) => <option key={option} value={option}>{STATUS_LABELS[option] ?? option}</option>)}
    </select>
  )
}

function AdminSortableTh({ children, defaultDirection = 'asc', field, onSort, sortBy }) {
  const [activeField, direction = 'asc'] = sortBy.split(':')
  const active = activeField === field
  const nextDirection = active && direction === 'asc' ? 'desc' : 'asc'
  const nextSort = active ? `${field}:${nextDirection}` : `${field}:${defaultDirection}`

  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className={`admin-sort-header${active ? ' is-active' : ''}`} onClick={() => onSort(nextSort)} type="button">
        <span>{children}</span>
        <span aria-hidden="true" className="admin-sort-arrows">{active ? (direction === 'asc' ? '↑' : '↓') : '↑↓'}</span>
      </button>
    </th>
  )
}

function AdminTableState({ error, loading }) {
  if (loading) return <p className="admin-empty">Loading admin data...</p>
  if (error) return <p className="admin-empty">{error}</p>
  return null
}

function AdminNoResults({ colSpan }) {
  return <tr><td className="admin-table-empty" colSpan={colSpan}>No matching records</td></tr>
}

function AdminPagination({ currentPage, last, onPageChange, totalElements, totalPages }) {
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

function AdminStatus({ status }) {
  const normalized = normalizeStatus(status)
  const cssStatus = normalized === 'banned' ? 'blocked' : normalized === 'resolved' ? 'approved' : normalized
  return <span className={`admin-status admin-status--${cssStatus}`}>{STATUS_LABELS[normalized] ?? status ?? '-'}</span>
}

function AdminNameCell({ name }) {
  return <span className="admin-name-cell"><span>{getInitial(name)}</span><strong>{name}</strong><small>student@fpt.edu.vn</small></span>
}

function AdminLogItem({ text, time, title, tone }) {
  return <div className={`admin-log admin-log--${tone}`}><i /><p><strong>{title}</strong><small>{text}</small></p>{time && <span>{time}</span>}</div>
}

function StorageMetric({ label, sub, tone, value }) {
  return <article className={`storage-metric storage-metric--${tone}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</article>
}

function AdminUserModal({ onClose, user }) {
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-user-modal">
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <h2>Account Details</h2>
        <div className="admin-user-profile"><span>{getInitial(user.fullName || user.email)}</span><div><h3>{user.fullName || user.email}</h3><p>Joined: {formatDate(user.createdAt)}</p></div></div>
        <div className="admin-detail-grid">
          <InfoBlock label="Email" value={user.email || '-'} />
          <InfoBlock label="Student Code" value={user.studentCode || '-'} />
          <InfoBlock label="Verification" value={user.verificationStatus || '-'} />
          <InfoBlock label="Role" value={user.roleName || '-'} />
          <InfoBlock label="Plan" value={user.planName || '-'} />
        </div>
        <footer><p><small>Account Status</small><strong className="green-text">{user.status || '-'}</strong></p></footer>
      </section>
    </div>
  )
}

function AdminCourseModal({ course = {}, mode, onClose, onSaved }) {
  const edit = mode === 'edit'
  const majors = useAdminList(getAdminMajors)
  const hasMajors = majors.data.length > 0
  const [form, setForm] = useState(() => ({
    courseCode: course.courseCode || '',
    courseName: course.courseName || '',
    description: course.description || '',
    majorId: course.major?.id || '',
    isActive: course.isActive ?? true,
  }))

  const submit = async (event) => {
    event.preventDefault()
    const payload = { ...form, majorId: Number(form.majorId) }
    await runAdminAction(
      () => (edit ? updateAdminCourse(course.id, payload) : createAdminCourse(payload)),
      onSaved,
      edit ? 'Course updated' : 'Course created',
    )
    onClose()
  }

  return (
    <div className="admin-modal-backdrop">
      <form className="admin-course-modal" onSubmit={submit}>
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <h2>{edit ? 'Edit Subject' : 'Add New Subject'}</h2>
        <label>Course Code<input onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="e.g. CEA201" required value={form.courseCode} /></label>
        <label>Course Name<input onChange={(e) => setForm({ ...form, courseName: e.target.value })} placeholder="e.g. Computer Architecture" required value={form.courseName} /></label>
        <label>Description<input onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" value={form.description} /></label>
        <label>
          Major
          <select disabled={majors.loading || Boolean(majors.error) || !hasMajors} onChange={(e) => setForm({ ...form, majorId: e.target.value })} required value={form.majorId}>
            <option value="">
              {majors.loading ? 'Loading majors...' : majors.error ? 'Unable to load majors' : hasMajors ? 'Select major' : 'No majors available'}
            </option>
            {majors.data.map((major) => <option key={major.id} value={major.id}>{major.majorCode} - {major.majorName}</option>)}
          </select>
          {majors.error && <small className="admin-field-error">{majors.error}</small>}
          {!majors.loading && !majors.error && !hasMajors && <small className="admin-field-error">Please create a major in Settings first.</small>}
        </label>
        <footer><button onClick={onClose} type="button">Cancel</button><button className="dark-button" type="submit">{edit ? 'Update' : 'Add Subject'}</button></footer>
      </form>
    </div>
  )
}
