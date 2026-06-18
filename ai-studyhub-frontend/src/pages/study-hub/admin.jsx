import { useCallback, useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import {
  banAdminUser,
  createAdminCourse,
  deleteAdminCourse,
  getAdminCourses,
  getAdminDocuments,
  getAdminReports,
  getAdminUsers,
  moderateAdminDocument,
  resolveAdminReport,
  unbanAdminUser,
  updateAdminCourse,
} from '../../services/adminService'
import { adminNavItems } from './config'
import { InfoBlock } from './shared'

export function AdminApp({ route, onLogout, onNavigate }) {
  const [userModal, setUserModal] = useState(null)

  return (
    <AdminLayout active={route} onLogout={onLogout} onNavigate={onNavigate}>
      {route === 'admin-overview' && <AdminOverview />}
      {route === 'admin-users' && <AdminUsers onOpenUser={setUserModal} />}
      {route === 'admin-documents' && <AdminDocuments />}
      {route === 'admin-courses' && <AdminCourses />}
      {route === 'admin-storage' && <AdminStorage />}
      {route === 'admin-reports' && <AdminReports />}
      {route === 'admin-logs' && <AdminLogs />}
      {route === 'admin-settings' && <AdminSettings />}
      {userModal && <AdminUserModal user={userModal} onClose={() => setUserModal(null)} />}
    </AdminLayout>
  )
}

function AdminLayout({ active, children, onLogout, onNavigate }) {
  return (
    <div className="admin-shell">
      <AdminSidebar active={active} onLogout={onLogout} onNavigate={onNavigate} />
      <div className="admin-body">
        <AdminTopbar />
        {children}
      </div>
    </div>
  )
}

function AdminSidebar({ active, onLogout, onNavigate }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img src="/app-logo.png" alt="AI Study Hub" />
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
        <div><strong>Admin FPTU</strong><small>admin@fpt.edu.vn</small></div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <StudyHubIcon name="logout" size={18} /> Đăng xuất
      </button>
    </aside>
  )
}

function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <Badge tone="purple">Admin</Badge>
      <strong>Admin FPTU</strong>
    </header>
  )
}

function AdminOverview() {
  const users = useAdminList(getAdminUsers)
  const documents = useAdminList(getAdminDocuments)
  const reports = useAdminList(getAdminReports)
  const loading = users.loading || documents.loading || reports.loading
  const error = users.error || documents.error || reports.error
  const normalizedUsers = useMemo(() => users.items.map(mapAdminUser), [users.items])
  const normalizedDocuments = useMemo(() => documents.items.map(mapAdminDocument), [documents.items])
  const normalizedReports = useMemo(() => reports.items.map(mapAdminReport), [reports.items])
  const adminStats = [
    ['users', normalizedUsers.length, 'Tổng người dùng', 'API', 'users'],
    ['documents', normalizedDocuments.length, 'Tổng tài liệu', 'API', 'file'],
    ['pending-documents', normalizedDocuments.filter((document) => document.status === 'pending').length, 'Tài liệu chờ duyệt', 'API', 'check'],
    ['reports', normalizedReports.filter((report) => report.status === 'pending').length, 'Báo cáo chờ xử lý', 'API', 'flag'],
  ]
  const adminUsers = normalizedUsers

  return (
    <main className="admin-page admin-page--dashboard">
      {loading && <p className="api-status">Đang tải dữ liệu admin...</p>}
      {error && <p className="api-status api-status--error">{formatAdminError(error)}</p>}
      <div className="admin-stat-grid">
        {adminStats.map(([id, value, label, change, icon]) => (
          <article className="admin-stat-card" key={id}>
            <span><StudyHubIcon name={icon} size={22} /></span>
            <small>{change}</small>
            <strong>{value}</strong>
            <p>{label}</p>
          </article>
        ))}
      </div>
      <section className="admin-card recent-users">
        <h2><StudyHubIcon name="users" size={20} /> Người dùng mới</h2>
        {adminUsers.slice(0, 3).map((user) => (
          <div className="admin-user-mini" key={user.email}>
            <span>{user.initial}</span>
            <p><strong>{user.name}</strong><small>{user.email}</small></p>
            <AdminStatus status={user.status === 'active' ? 'active' : 'suspended'} />
            <StudyHubIcon name="eye" size={15} />
          </div>
        ))}
      </section>
      <div className="admin-chart-grid">
        <AdminChart title="Xu hướng tải lên/tải xuống" type="line" />
        <AdminChart title="Phân bổ tài liệu theo môn học" type="pie" />
        <AdminChart title="Người dùng hoạt động theo ngày" type="bars" />
        <AdminChart title="AI Chat Usage (24h)" type="curve" />
      </div>
      <section className="admin-card system-activity">
        <h2><StudyHubIcon name="trend" size={18} /> Hoạt động hệ thống</h2>
        <AdminLogItem tone="blue" title="Người dùng mới đăng ký" text="Nguyễn Văn A đã tham gia - 2 giờ trước" />
        <AdminLogItem tone="green" title="Tài liệu được duyệt" text="CEA201 - Chapter 5 đã được phê duyệt - 5 giờ trước" />
        <AdminLogItem tone="orange" title="Báo cáo mới" text="Nội dung vi phạm được báo cáo - 1 ngày trước" />
      </section>
    </main>
  )
}

function AdminUsers({ onOpenUser }) {
  const { error, items, loading, refresh, setError } = useAdminList(getAdminUsers)
  const adminUsers = useMemo(() => items.map(mapAdminUser), [items])

  const handleToggleBan = (user) => runAdminAction(setError, async () => {
    if (!user.id) return
    const blocked = user.status === 'blocked' || user.status === 'suspended' || user.status === 'banned'
    await (blocked ? unbanAdminUser(user.id) : banAdminUser(user.id))
    await refresh()
  })

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="users" title="Quản lý người dùng">
          <AdminSearch placeholder="Tìm kiếm người dùng..." />
        </AdminSectionHeader>
        {loading && <p className="api-status">Đang tải người dùng...</p>}
        {error && <p className="api-status api-status--error">{formatAdminError(error)}</p>}
        <table className="admin-table">
          <thead><tr><th>Người dùng</th><th>Email</th><th>Tham gia</th><th>Tài liệu</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            {adminUsers.map((user) => (
              <tr key={user.email}>
                <td><span className="admin-avatar">{user.initial}</span>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.joined}</td>
                <td>{user.docs}</td>
                <td><AdminStatus status={user.status} /></td>
                <td className="admin-actions">
                  <button onClick={() => onOpenUser(user)} type="button"><StudyHubIcon name="eye" size={16} /></button>
                  <button onClick={() => handleToggleBan(user)} type="button"><StudyHubIcon name={user.status === 'active' ? 'x' : 'check'} size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminDocuments() {
  const { error, items, loading, refresh, setError } = useAdminList(getAdminDocuments)
  const adminDocuments = useMemo(() => items.map(mapAdminDocumentRow), [items])

  const handleModerate = (documentId, status) => runAdminAction(setError, async () => {
    if (!documentId) return
    await moderateAdminDocument(documentId, status)
    await refresh()
  })

  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="file" title="Quản lý tài liệu">
          <input className="admin-filter-input" />
          {loading && <p className="api-status">Đang tải tài liệu...</p>}
          {error && <p className="api-status api-status--error">{formatAdminError(error)}</p>}
          <AdminSearch placeholder="Tìm kiếm tài liệu..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>Tiêu đề</th><th>Người tải</th><th>Ngày tải</th><th>Lượt tải</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            {adminDocuments.map(([title, owner, date, downloads, status, id]) => (
              <tr key={id ?? title}>
                <td>{title}</td><td>{owner}</td><td>{date}</td><td>{downloads}</td><td><AdminStatus status={status} /></td>
                <td className="admin-actions"><button onClick={() => handleModerate(id, 'APPROVED')} type="button"><StudyHubIcon name="check" size={16} /></button><button onClick={() => handleModerate(id, 'REJECTED')} type="button"><StudyHubIcon name="x" size={16} /></button><button onClick={() => handleModerate(id, 'ARCHIVED')} type="button"><StudyHubIcon name="archive" size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminCourses() {
  const { error, items, loading, refresh, setError } = useAdminList(getAdminCourses)
  const adminCourses = useMemo(() => items.map(mapAdminCourseRow), [items])
  const [courseForm, setCourseForm] = useState(createCourseForm)
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [showCourseForm, setShowCourseForm] = useState(false)

  const handleStartAdd = () => {
    setCourseForm(createCourseForm())
    setEditingCourseId(null)
    setShowCourseForm(true)
    setError('')
  }

  const handleStartEdit = (course) => {
    setCourseForm(createCourseForm(course))
    setEditingCourseId(course.id)
    setShowCourseForm(true)
    setError('')
  }

  const handleCancelCourseForm = () => {
    setCourseForm(createCourseForm())
    setEditingCourseId(null)
    setShowCourseForm(false)
  }

  const handleCourseFormChange = (event) => {
    const { checked, name, type, value } = event.target
    setCourseForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmitCourse = (event) => runAdminAction(setError, async () => {
    event.preventDefault()
    const payload = buildCoursePayload(courseForm)
    if (editingCourseId) {
      await updateAdminCourse(editingCourseId, payload)
    } else {
      await createAdminCourse(payload)
    }
    handleCancelCourseForm()
    await refresh()
  })

  const handleDelete = (course) => runAdminAction(setError, async () => {
    if (!course.id || !window.confirm(`Xóa môn ${course.courseCode || course.id}?`)) return
    await deleteAdminCourse(course.id)
    await refresh()
  })

  return (
    <main className="admin-page">
      <section className="admin-card admin-course-card">
        <AdminSectionHeader icon="book" title="Quản lý môn học">
          <button className="admin-primary" onClick={handleStartAdd} type="button"><StudyHubIcon name="plus" size={18} /> Thêm môn học</button>
        </AdminSectionHeader>
        <div className="admin-search-row">
          <AdminSearch placeholder="Tìm kiếm môn học..." />
          <input />
        </div>
        {showCourseForm && (
          <form className="admin-course-form" onSubmit={handleSubmitCourse}>
            <label>
              <span>Mã môn học</span>
              <input name="courseCode" onChange={handleCourseFormChange} placeholder="VD: CEA201" required value={courseForm.courseCode} />
            </label>
            <label>
              <span>Tên môn học</span>
              <input name="courseName" onChange={handleCourseFormChange} placeholder="VD: Computer Architecture" required value={courseForm.courseName} />
            </label>
            <label>
              <span>Major ID</span>
              <input min="1" name="majorId" onChange={handleCourseFormChange} placeholder="VD: 1" required type="number" value={courseForm.majorId} />
            </label>
            <label className="admin-course-form__wide">
              <span>Mô tả</span>
              <textarea name="description" onChange={handleCourseFormChange} placeholder="Mô tả ngắn về môn học" rows={3} value={courseForm.description} />
            </label>
            <label className="admin-course-form__toggle">
              <input checked={courseForm.isActive} name="isActive" onChange={handleCourseFormChange} type="checkbox" />
              <span>Đang hoạt động</span>
            </label>
            <div className="admin-course-form__actions">
              <button className="admin-primary" type="submit">{editingCourseId ? 'Cập nhật môn học' : 'Lưu môn học'}</button>
              <button className="admin-secondary" onClick={handleCancelCourseForm} type="button">Hủy</button>
            </div>
          </form>
        )}
        {loading && <p className="api-status">Đang tải môn học...</p>}
        {error && <p className="api-status api-status--error">{formatAdminError(error)}</p>}
        <div className="course-grid">
          {adminCourses.map(([code, name, semester, major, count, course]) => (
            <article className="course-card" key={code}>
              <div>
                <h3>{code}</h3>
                <p>{name}</p>
              </div>
              <div className="course-actions">
                <button onClick={() => handleStartEdit(course)} type="button"><StudyHubIcon name="edit" size={16} /></button>
                <button onClick={() => handleDelete(course)} type="button"><StudyHubIcon name="archive" size={16} /></button>
              </div>
              <div><Badge tone="purple">{semester}</Badge><Badge tone="blue">{major}</Badge></div>
              <footer><span>{count} tài liệu</span><button type="button">Xem →</button></footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function AdminStorage() {
  return (
    <main className="admin-page">
      <div className="storage-summary">
        <StorageMetric tone="blue" label="Tổng dung lượng" value="500 GB" />
        <StorageMetric tone="green" label="Đã sử dụng" value="287 GB" sub="57.4%" />
        <StorageMetric tone="purple" label="Còn trống" value="213 GB" sub="42.6%" />
      </div>
      <div className="admin-chart-grid">
        <section className="admin-card storage-bars">
          <h2>Phân bổ dung lượng</h2>
          {[
            ['PDF', '125 GB (43%)', 78, 'red'],
            ['Word/PowerPoint', '89 GB (31%)', 56, 'blue'],
            ['ZIP/RAR', '56 GB (19%)', 34, 'green'],
            ['Khác', '17 GB (7%)', 14, 'gray'],
          ].map(([label, value, width, tone]) => (
            <div className="storage-row" key={label}><span>{label}</span><small>{value}</small><i className={tone} style={{ width: `${width}%` }} /></div>
          ))}
        </section>
        <AdminChart title="Xu hướng sử dụng (30 ngày)" type="area" />
      </div>
      <section className="admin-card admin-table-card">
        <h2>File lớn nhất</h2>
        <table className="admin-table">
          <thead><tr><th>Tên file</th><th>Người tải</th><th>Kích thước</th><th>Loại</th></tr></thead>
          <tbody>
            {[
              ['SWP391-Complete-Project.zip', 'Nguyễn Văn A', '245 MB', 'ZIP'],
              ['CEA201-Full-Course-Slides.pdf', 'Trần Thị B', '189 MB', 'PDF'],
              ['PRF192-Video-Lectures.zip', 'Lê Văn C', '167 MB', 'ZIP'],
            ].map(([name, owner, size, type]) => <tr key={name}><td>{name}</td><td>{owner}</td><td>{size}</td><td><Badge tone="blue">{type}</Badge></td></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminReports() {
  const { error, items, loading, refresh, setError } = useAdminList(getAdminReports)
  const rows = useMemo(() => items.map(mapAdminReportRow), [items])
  const handleResolve = (reportId, status, deleteDocument = false) => runAdminAction(setError, async () => {
    if (!reportId) return
    await resolveAdminReport(reportId, status, deleteDocument)
    await refresh()
  })
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="flag" title="Báo cáo vi phạm">
          <input className="admin-filter-input" />
          <AdminSearch placeholder="Tìm kiếm báo cáo..." />
        </AdminSectionHeader>
        {loading && <p className="api-status">Đang tải báo cáo...</p>}
        {error && <p className="api-status api-status--error">{formatAdminError(error)}</p>}
        <table className="admin-table">
          <thead><tr><th>Người báo cáo</th><th>Người vi phạm</th><th>Loại vi phạm</th><th>Ngày báo cáo</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>{rows.map(([a, b, type, date, status, id]) => <tr key={id ?? type}><td><AdminNameCell name={a} /></td><td><AdminNameCell name={b} orange /></td><td><Badge tone="orange">{type}</Badge></td><td>{date}</td><td><AdminStatus status={status} /></td><td className="admin-actions"><button type="button"><StudyHubIcon name="eye" size={15} /></button><button onClick={() => handleResolve(id, 'RESOLVED')} type="button"><StudyHubIcon name="check" size={15} /></button><button onClick={() => handleResolve(id, 'REJECTED')} type="button"><StudyHubIcon name="x" size={15} /></button></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  )
}

function AdminLogs() {
  return (
    <main className="admin-page">
      <section className="admin-card logs-card">
        <AdminSectionHeader icon="trend" title="Activity Logs">
          <input className="admin-filter-input" />
          <button className="admin-primary" type="button">Export</button>
        </AdminSectionHeader>
        <AdminLogItem tone="blue" title="Người dùng mới đăng ký" text="Nguyễn Văn A (studenta@fpt.edu.vn)" time="2 phút trước" />
        <AdminLogItem tone="green" title="Tài liệu mới được tải lên" text="CEA201 - Chapter 5: Cache Memory" time="15 phút trước" />
        <AdminLogItem tone="green" title="Tài liệu được duyệt" text="PRF192 - Assignment Solution" time="1 giờ trước" />
        <AdminLogItem tone="red" title="Người dùng bị suspend" text="Lê Văn C - Vi phạm chính sách" time="2 giờ trước" />
        <AdminLogItem tone="purple" title="Backup hệ thống hoàn tất" text="Database backup - 287GB" time="3 giờ trước" />
        <AdminLogItem tone="orange" title="Tài liệu bị từ chối" text="PRO192 - Plagiarized content detected" time="5 giờ trước" />
        <AdminLogItem tone="blue" title="Admin đăng nhập" text="Admin Dashboard access" time="8 giờ trước" />
      </section>
    </main>
  )
}

function AdminSettings() {
  return (
    <main className="admin-page settings-page">
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="sparkle" size={18} /> Cài đặt chung</h2>
        <label>Tên hệ thống<input defaultValue="AI Study Hub" /></label>
        <label>Email liên hệ<input defaultValue="admin@aistudyhub.com" /></label>
        <label>Kích thước file tối đa (MB)<input defaultValue="50" /></label>
        <SettingToggle title="Tự động duyệt tài liệu" text="Bỏ qua quy trình kiểm duyệt thủ công" />
        <SettingToggle title="Cho phép đăng ký mới" text="Người dùng có thể tạo tài khoản mới" active />
        <button className="admin-primary" type="button"><StudyHubIcon name="file" size={16} /> Lưu cài đặt</button>
      </section>
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="lock" size={18} /> Bảo mật</h2>
        <SettingAction title="Đổi mật khẩu admin" text="Cập nhật mật khẩu đăng nhập" icon="edit" />
        <SettingAction title="Quản lý phiên đăng nhập" text="Xem và đăng xuất các phiên hoạt động" icon="eye" />
        <SettingAction danger title="Xóa tất cả dữ liệu" text="Xóa vĩnh viễn toàn bộ dữ liệu hệ thống" icon="archive" />
      </section>
    </main>
  )
}

function AdminChart({ title, type }) {
  return (
    <section className={`admin-card admin-chart admin-chart--${type}`}>
      <h2>{title}</h2>
      {type === 'pie' ?<div className="fake-pie" /> : <div className="fake-chart">{[35, 48, 66, 60, 78, 56, 40].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>}
      <small>{type === 'pie' ? 'CEA201 19% · PRF192 16% · Khác 30%' : 'Tải lên → Tải xuống'}</small>
    </section>
  )
}

function AdminSectionHeader({ children, icon, title }) {
  return <header className="admin-section-header"><h1><StudyHubIcon name={icon} size={28} /> {title}</h1><div>{children}</div></header>
}

function AdminSearch({ placeholder }) {
  return <label className="admin-search"><StudyHubIcon name="search" size={18} /><input placeholder={placeholder} /></label>
}

function AdminStatus({ status }) {
  const labels = { active: 'Hoạt động', blocked: 'Bị cấm', suspended: 'Suspended', pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }
  return <span className={`admin-status admin-status--${status}`}>{labels[status] ?? status}</span>
}

function AdminNameCell({ name, orange = false }) {
  return <span className="admin-name-cell"><span className={orange ? 'orange' : ''}>{name.charAt(0)}</span><strong>{name}</strong><small>student@fpt.edu.vn</small></span>
}

function AdminLogItem({ text, time, title, tone }) {
  return <div className={`admin-log admin-log--${tone}`}><i /><p><strong>{title}</strong><small>{text}</small></p>{time && <span>{time}</span>}</div>
}

function StorageMetric({ label, sub, tone, value }) {
  return <article className={`storage-metric storage-metric--${tone}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</article>
}

function SettingToggle({ active = false, text, title }) {
  return <div className="setting-row"><p><strong>{title}</strong><small>{text}</small></p><span className={active ? 'toggle is-on' : 'toggle'} /></div>
}

function SettingAction({ danger = false, icon, text, title }) {
  return <div className={danger ? 'setting-row setting-row--danger' : 'setting-row'}><p><strong>{title}</strong><small>{text}</small></p><StudyHubIcon name={icon} size={18} /></div>
}

function AdminUserModal({ onClose, user }) {
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-user-modal">
        <button className="admin-modal-close" onClick={onClose} type="button">×</button>
        <h2>Chi tiết tài khoản</h2>
        <div className="admin-user-profile"><span>{user.initial}</span><div><h3>{user.name}</h3><p>Tham gia: {user.joined}</p></div></div>
        <div className="admin-detail-grid">
          <InfoBlock label="Email" value={user.email} />
          <InfoBlock label="Số điện thoại" value="0912345678" />
          <InfoBlock label="Giới tính" value="Nam" />
          <InfoBlock label="Ngày sinh" value="15/03/2002" />
          <InfoBlock label="Địa chỉ" value="123 Nguyễn Huệ, Q.1, TP.HCM" />
        </div>
        <footer><p><small>Trạng thái tài khoản</small><strong className="green-text">Hoạt động</strong></p><p><small>Tổng tài liệu</small><strong className="purple-text">{user.docs}</strong></p></footer>
      </section>
    </div>
  )
}

function useAdminList(loadItems) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await loadItems()
      setItems(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }, [loadItems])

  useEffect(() => {
    let active = true
    loadItems()
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (active) setError(requestError)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadItems])

  return { error, items, loading, refresh, setError }
}

async function runAdminAction(setError, action) {
  setError('')
  try {
    await action()
  } catch (requestError) {
    setError(requestError)
  }
}

function mapAdminUser(user) {
  const name = user.fullName || user.email || `User #${user.id ?? ''}`.trim()
  return {
    id: user.id,
    initial: getInitials(name),
    name,
    email: user.email || '-',
    joined: formatAdminDate(user.createdAt),
    docs: user.planName || user.studentCode || user.roleName || '-',
    status: mapUserStatus(user.status),
    raw: user,
  }
}

function mapAdminDocument(document) {
  return {
    id: document.id,
    title: document.title || document.fileName || `Document #${document.id ?? ''}`.trim(),
    owner: document.ownerEmail || '-',
    date: formatAdminDate(document.createdAt),
    fileSize: formatAdminFileSize(document.fileSize),
    status: mapModerationStatus(document.moderationStatus),
    raw: document,
  }
}

function mapAdminDocumentRow(document) {
  const item = mapAdminDocument(document)
  return [item.title, item.owner, item.date, item.fileSize, item.status, item.id]
}

function mapAdminReport(report) {
  const status = mapReportStatus(report.status)
  return {
    id: report.id,
    reporter: report.reporterEmail || '-',
    documentId: report.documentId,
    documentTitle: report.documentTitle || `Document #${report.documentId ?? ''}`.trim(),
    reportType: report.reportType || 'Report',
    reportReason: report.reportReason || '',
    status,
    statusLabel: status,
    date: formatAdminDate(report.createdAt),
    raw: report,
  }
}

function mapAdminReportRow(report) {
  const item = mapAdminReport(report)
  return [item.reporter, item.documentTitle, item.reportType, item.date, item.status, item.id]
}

function mapAdminCourseRow(course) {
  return [
    course.courseCode || `COURSE-${course.id ?? ''}`,
    course.courseName || '-',
    course.isActive === false ? 'Inactive' : 'Active',
    course.major?.majorCode || course.major?.majorName || '-',
    course.description || '-',
    course,
  ]
}

function createCourseForm(course = {}) {
  return {
    courseCode: course.courseCode || '',
    courseName: course.courseName || '',
    description: course.description || '',
    majorId: course.major?.id ? String(course.major.id) : '',
    isActive: course.isActive ?? true,
  }
}

function buildCoursePayload(form) {
  const majorId = Number(form.majorId)
  if (!Number.isFinite(majorId) || majorId <= 0) {
    throw new Error('Major ID phải là số lớn hơn 0.')
  }

  return {
    courseCode: form.courseCode.trim(),
    courseName: form.courseName.trim(),
    description: form.description.trim(),
    majorId,
    isActive: Boolean(form.isActive),
  }
}

function getInitials(name = '') {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('')
  return initials.toUpperCase() || 'U'
}

function formatAdminDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date)
}

function formatAdminFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}

function formatAdminError(error) {
  if (!error) return ''
  if (error.status === 401 || error.status === 403) return 'Tài khoản hiện tại không có quyền admin hoặc phiên đăng nhập đã hết hạn.'
  return error.message || 'Không thể gọi API admin.'
}

function mapUserStatus(status = '') {
  const value = status.toLowerCase()
  if (value.includes('ban') || value.includes('block') || value.includes('suspend')) return 'blocked'
  if (value.includes('active')) return 'active'
  return value || 'pending'
}

function mapModerationStatus(status = '') {
  const value = status.toLowerCase()
  if (value.includes('approve')) return 'approved'
  if (value.includes('reject')) return 'rejected'
  if (value.includes('pending')) return 'pending'
  return value || 'pending'
}

function mapReportStatus(status = '') {
  const value = status.toLowerCase()
  if (value.includes('resolve') || value.includes('approve')) return 'approved'
  if (value.includes('reject')) return 'rejected'
  if (value.includes('pending')) return 'pending'
  return value || 'pending'
}
