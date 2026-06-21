import { useCallback, useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import {
  banAdminUser,
  createAdminCategory,
  createAdminCourse,
  createAdminMajor,
  createAdminPlan,
  deleteAdminCategory,
  deleteAdminCourse,
  deleteAdminMajor,
  deleteAdminPlan,
  getAdminCategories,
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
  updateAdminCategory,
  updateAdminCourse,
  updateAdminMajor,
  updateAdminPlan,
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
      <section className="admin-card recent-users">
        <h2><StudyHubIcon name="users" size={20} /> New Users</h2>
        {users.slice(0, 3).map((user) => (
          <button className="admin-user-mini" key={user.id || user.email} onClick={() => onOpenUser(user)} type="button">
            <span>{getInitial(user.fullName || user.email)}</span>
            <p><strong>{user.fullName || user.email}</strong><small>{user.email}</small></p>
            <AdminStatus status={user.status} />
            <StudyHubIcon name="eye" size={15} />
          </button>
        ))}
      </section>
      <div className="admin-chart-grid">
        <AdminChart title="Upload/Download Trends" type="line" />
        <AdminChart title="Document Distribution by Subject" type="pie" />
        <AdminChart title="Active Users by Day" type="bars" />
        <AdminChart title="AI Chat Usage (24h)" type="curve" />
      </div>
      <section className="admin-card system-activity">
        <h2><StudyHubIcon name="trend" size={18} /> System Activities</h2>
        {reports.slice(0, 3).map((report) => (
          <AdminLogItem
            key={report.id}
            text={`${report.documentTitle || 'Document'} - ${formatDate(report.createdAt)}`}
            title={report.reportType || 'Report'}
            tone="orange"
          />
        ))}
      </section>
    </main>
  )
}

function AdminUsers({ onOpenUser }) {
  const { data: users, error, loading, reload } = useAdminList(getAdminUsers)

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="users" title="User Management">
          <AdminSearch placeholder="Search users..." />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead><tr><th>User</th><th>Email</th><th>Joined</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((user) => {
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
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminDocuments() {
  const { data: documents, error, loading, reload } = useAdminList(getAdminDocuments)

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="file" title="Document Management">
          <input className="admin-filter-input" placeholder="Status" />
          <AdminSearch placeholder="Search documents..." />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Uploader</th><th>Upload Date</th><th>Size</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id || doc.title}>
                <td>{doc.title || doc.fileName}</td>
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
              <span>{doc.fileName || doc.title}</span>
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
                <td>{doc.fileName || doc.title}</td><td>{doc.ownerEmail}</td><td>{formatBytes(doc.fileSize)}</td><td><Badge tone="blue">{doc.visibility || '-'}</Badge></td>
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
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="flag" title="Reports">
          <input className="admin-filter-input" placeholder="Status" />
          <AdminSearch placeholder="Search reports..." />
        </AdminSectionHeader>
        <AdminTableState error={error} loading={loading} />
        <table className="admin-table">
          <thead><tr><th>Reporter</th><th>Document</th><th>Violation Type</th><th>Report Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{reports.map((report) => (
            <tr key={report.id}>
              <td><AdminNameCell name={report.reporterEmail || '-'} /></td>
              <td>{report.documentTitle || `Document #${report.documentId}`}</td>
              <td><Badge tone="orange">{report.reportType || '-'}</Badge></td>
              <td>{formatDate(report.createdAt)}</td>
              <td><AdminStatus status={report.status} /></td>
              <td className="admin-actions">
                <button onClick={() => callToast(report.reportReason || 'No reason provided', 'info')} type="button"><StudyHubIcon name="eye" size={15} /></button>
                <button onClick={() => runAdminAction(() => resolveAdminReport(report.id, 'RESOLVED', false), reload, 'Report resolved')} type="button"><StudyHubIcon name="check" size={15} /></button>
                <button onClick={() => runAdminAction(() => resolveAdminReport(report.id, 'RESOLVED', true), reload, 'Report resolved and document rejected')} type="button"><StudyHubIcon name="x" size={15} /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </main>
  )
}

function AdminLogs() {
  const { data: reports } = useAdminList(getAdminReports)
  const { data: documents } = useAdminList(getAdminDocuments)
  const items = [
    ...reports.slice(0, 3).map((report) => ({ tone: 'orange', title: report.reportType || 'Report', text: report.documentTitle || report.reportReason, time: formatDate(report.createdAt) })),
    ...documents.slice(0, 3).map((doc) => ({ tone: 'green', title: 'Document Uploaded', text: doc.title || doc.fileName, time: formatDate(doc.createdAt) })),
  ]

  return (
    <main className="admin-page">
      <section className="admin-card logs-card">
        <AdminSectionHeader icon="trend" title="Activity Logs">
          <input className="admin-filter-input" placeholder="Search" />
          <button className="admin-primary" type="button">Export</button>
        </AdminSectionHeader>
        {items.map((item, index) => <AdminLogItem key={`${item.title}-${index}`} {...item} />)}
      </section>
    </main>
  )
}

function AdminSettings() {
  const plans = useAdminList(getAdminPlans)
  const majors = useAdminList(getAdminMajors)
  const categories = useAdminList(getAdminCategories)
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
          fields={['categoryName']}
          items={categories.data}
          labelKey="categoryName"
          loading={categories.loading}
          onCreate={() => createLookup('category', categories.reload)}
          onDelete={(item) => runAdminAction(() => deleteAdminCategory(item.id), categories.reload, 'Category deleted')}
          onUpdate={(item) => updateLookup('category', item, categories.reload)}
          title="Categories"
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
    category: () => createAdminCategory(body),
    major: () => createAdminMajor(body),
    plan: () => createAdminPlan(body),
  }
  await runAdminAction(actions[type], reload, `${type} created`)
}

async function updateLookup(type, item, reload) {
  const body = promptLookup(type, item)
  if (!body) return
  const actions = {
    category: () => updateAdminCategory(item.id, body),
    major: () => updateAdminMajor(item.id, body),
    plan: () => updateAdminPlan(item.id, body),
  }
  await runAdminAction(actions[type], reload, `${type} updated`)
}

function promptLookup(type, item = {}) {
  if (type === 'category') {
    const categoryName = window.prompt('Category name', item.categoryName || '')
    return categoryName ? { categoryName } : null
  }
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

function AdminChart({ title, type }) {
  return (
    <section className={`admin-card admin-chart admin-chart--${type}`}>
      <h2>{title}</h2>
      {type === 'pie' ? <div className="fake-pie" /> : <div className="fake-chart">{[35, 48, 66, 60, 78, 56, 40].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>}
      <small>{type === 'pie' ? 'Courses and categories' : 'Live admin summary'}</small>
    </section>
  )
}

function AdminSectionHeader({ children, icon, title }) {
  return <header className="admin-section-header"><h1><StudyHubIcon name={icon} size={28} /> {title}</h1><div>{children}</div></header>
}

function AdminSearch({ placeholder }) {
  return <label className="admin-search"><StudyHubIcon name="search" size={18} /><input placeholder={placeholder} /></label>
}

function AdminTableState({ error, loading }) {
  if (loading) return <p className="admin-empty">Loading admin data...</p>
  if (error) return <p className="admin-empty">{error}</p>
  return null
}

function AdminStatus({ status }) {
  const normalized = normalizeStatus(status)
  const cssStatus = normalized === 'banned' ? 'blocked' : normalized === 'resolved' ? 'approved' : normalized
  const labels = {
    active: 'Active',
    banned: 'Banned',
    blocked: 'Banned',
    suspended: 'Suspended',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    resolved: 'Resolved',
  }
  return <span className={`admin-status admin-status--${cssStatus}`}>{labels[normalized] ?? status ?? '-'}</span>
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
