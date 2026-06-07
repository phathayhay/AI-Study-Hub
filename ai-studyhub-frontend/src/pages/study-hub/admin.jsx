import { useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { adminCourses, adminDocuments, adminNavItems, adminUsers } from './config'
import { InfoBlock } from './shared'

export function AdminApp({ route, onNavigate }) {
  const [userModal, setUserModal] = useState(null)
  const [courseModal, setCourseModal] = useState(null)

  return (
    <AdminLayout active={route} onNavigate={onNavigate}>
      {route === 'admin-overview' && <AdminOverview />}
      {route === 'admin-users' && <AdminUsers onOpenUser={() => setUserModal(adminUsers[0])} />}
      {route === 'admin-documents' && <AdminDocuments />}
      {route === 'admin-courses' && <AdminCourses onAdd={() => setCourseModal('add')} onEdit={() => setCourseModal('edit')} />}
      {route === 'admin-storage' && <AdminStorage />}
      {route === 'admin-reports' && <AdminReports />}
      {route === 'admin-logs' && <AdminLogs />}
      {route === 'admin-settings' && <AdminSettings />}
      {userModal && <AdminUserModal user={userModal} onClose={() => setUserModal(null)} />}
      {courseModal && <AdminCourseModal mode={courseModal} onClose={() => setCourseModal(null)} />}
    </AdminLayout>
  )
}

function AdminLayout({ active, children, onNavigate }) {
  return (
    <div className="admin-shell">
      <AdminSidebar active={active} onNavigate={onNavigate} />
      <div className="admin-body">
        <AdminTopbar />
        {children}
      </div>
    </div>
  )
}

function AdminSidebar({ active, onNavigate }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <StudyHubIcon name="book" size={28} />
        <span><strong>AI Study Hub</strong><small>FPT University</small></span>
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
      <button className="admin-logout" onClick={() => onNavigate('login')} type="button">
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
  return (
    <main className="admin-page admin-page--dashboard">
      <div className="admin-stat-grid">
        {[
          ['users', '567', 'Tổng người dùng', '+12%', 'users'],
          ['documents', '1,234', 'Tổng tài liệu', '+8%', 'file'],
          ['downloads', '45,678', 'Lượt tải xuống', '+23%', 'download'],
          ['sessions', '2,456', 'AI Chat Sessions', '+15%', 'message'],
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
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="users" title="Quản lý người dùng">
          <AdminSearch placeholder="Tìm kiếm người dùng..." />
        </AdminSectionHeader>
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
                  <button onClick={onOpenUser} type="button"><StudyHubIcon name="eye" size={16} /></button>
                  <button type="button"><StudyHubIcon name="x" size={16} /></button>
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
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="file" title="Quản lý tài liệu">
          <input className="admin-filter-input" />
          <AdminSearch placeholder="Tìm kiếm tài liệu..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>Tiêu đề</th><th>Người tải</th><th>Ngày tải</th><th>Lượt tải</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            {adminDocuments.map(([title, owner, date, downloads, status]) => (
              <tr key={title}>
                <td>{title}</td><td>{owner}</td><td>{date}</td><td>{downloads}</td><td><AdminStatus status={status} /></td>
                <td className="admin-actions"><button><StudyHubIcon name="check" size={16} /></button><button><StudyHubIcon name="x" size={16} /></button><button><StudyHubIcon name="archive" size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminCourses({ onAdd, onEdit }) {
  return (
    <main className="admin-page">
      <section className="admin-card admin-course-card">
        <AdminSectionHeader icon="book" title="Quản lý môn học">
          <button className="admin-primary" onClick={onAdd} type="button"><StudyHubIcon name="plus" size={18} /> Thêm môn học</button>
        </AdminSectionHeader>
        <div className="admin-search-row">
          <AdminSearch placeholder="Tìm kiếm môn học..." />
          <input />
        </div>
        <div className="course-grid">
          {adminCourses.map(([code, name, semester, major, count]) => (
            <article className="course-card" key={code}>
              <div>
                <h3>{code}</h3>
                <p>{name}</p>
              </div>
              <div className="course-actions">
                <button onClick={onEdit} type="button"><StudyHubIcon name="edit" size={16} /></button>
                <button type="button"><StudyHubIcon name="archive" size={16} /></button>
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
  const rows = [
    ['Nguyễn Văn A', 'Trần Thị B', 'Nội dung không phù hợp', '28/5/2024', 'pending'],
    ['Lê Văn C', 'Phạm Văn D', 'Vi phạm bản quyền', '27/5/2024', 'rejected'],
    ['Hoàng Thị E', 'Nguyễn Văn F', 'Spam', '26/5/2024', 'approved'],
    ['Trần Văn G', 'Lê Thị H', 'Quấy rối', '25/5/2024', 'rejected'],
  ]
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="flag" title="Báo cáo vi phạm">
          <input className="admin-filter-input" />
          <AdminSearch placeholder="Tìm kiếm báo cáo..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>Người báo cáo</th><th>Người vi phạm</th><th>Loại vi phạm</th><th>Ngày báo cáo</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>{rows.map(([a, b, type, date, status]) => <tr key={type}><td><AdminNameCell name={a} /></td><td><AdminNameCell name={b} orange /></td><td><Badge tone="orange">{type}</Badge></td><td>{date}</td><td><AdminStatus status={status} /></td><td className="admin-actions"><button><StudyHubIcon name="eye" size={15} /></button><button><StudyHubIcon name="check" size={15} /></button><button><StudyHubIcon name="x" size={15} /></button></td></tr>)}</tbody>
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

function AdminCourseModal({ mode, onClose }) {
  const edit = mode === 'edit'
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-course-modal">
        <button className="admin-modal-close" onClick={onClose} type="button">×</button>
        <h2>{edit ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}</h2>
        <label>Mã môn học<input placeholder="VD: CEA201" defaultValue={edit ? 'CEA201' : ''} /></label>
        <label>Tên môn học<input placeholder="VD: Computer Architecture" defaultValue={edit ? 'Computer Architecture' : ''} /></label>
        <label>Học kỳ<input placeholder="VD: Kỳ 3" defaultValue={edit ? 'Kỳ 3' : ''} /></label>
        <label>Ngành<input placeholder="VD: SE" defaultValue={edit ? 'SE' : ''} /></label>
        <footer><button onClick={onClose} type="button">Hủy</button><button className="dark-button" type="button">{edit ? 'Cập nhật' : 'Thêm môn học'}</button></footer>
      </section>
    </div>
  )
}
