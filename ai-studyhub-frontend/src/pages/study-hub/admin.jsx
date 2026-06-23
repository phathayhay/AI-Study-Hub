import { useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { adminCourses, adminDocuments, adminNavItems, adminUsers } from './config'
import { InfoBlock } from './shared'

export function AdminApp({ route, onNavigate, onLogout }) {
  const [userModal, setUserModal] = useState(null)
  const [courseModal, setCourseModal] = useState(null)

  return (
    <AdminLayout active={route} onNavigate={onNavigate} onLogout={onLogout}>
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

function AdminLayout({ active, children, onNavigate, onLogout }) {
  return (
    <div className="admin-shell">
      <AdminSidebar active={active} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="admin-body">
        <AdminTopbar />
        {children}
      </div>
    </div>
  )
}

function AdminSidebar({ active, onNavigate, onLogout }) {
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
        <div><strong>FPTU Admin</strong><small>admin@fpt.edu.vn</small></div>
      </div>
      <button className="admin-logout" onClick={onLogout} type="button">
        <StudyHubIcon name="logout" size={18} /> Log Out
      </button>
    </aside>
  )
}

function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <Badge tone="purple">Admin</Badge>
      <strong>FPTU Admin</strong>
    </header>
  )
}

function AdminOverview() {
  return (
    <main className="admin-page admin-page--dashboard">
      <div className="admin-stat-grid">
        {[
          ['users', '567', 'Total Users', '+12%', 'users'],
          ['documents', '1,234', 'Total Documents', '+8%', 'file'],
          ['downloads', '45,678', 'Downloads', '+23%', 'download'],
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
        <h2><StudyHubIcon name="users" size={20} /> New Users</h2>
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
        <AdminChart title="Upload/Download Trends" type="line" />
        <AdminChart title="Document Distribution by Subject" type="pie" />
        <AdminChart title="Active Users by Day" type="bars" />
        <AdminChart title="AI Chat Usage (24h)" type="curve" />
      </div>
      <section className="admin-card system-activity">
        <h2><StudyHubIcon name="trend" size={18} /> System Activities</h2>
        <AdminLogItem tone="blue" title="New User Registration" text="Nguyen Van A joined - 2 hours ago" />
        <AdminLogItem tone="green" title="Document Approved" text="CEA201 - Chapter 5 approved - 5 hours ago" />
        <AdminLogItem tone="orange" title="New Report" text="Inappropriate content reported - 1 day ago" />
      </section>
    </main>
  )
}

function AdminUsers({ onOpenUser }) {
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="users" title="User Management">
          <AdminSearch placeholder="Search users..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Email</th><th>Joined</th><th>Documents</th><th>Status</th><th>Actions</th></tr></thead>
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
        <AdminSectionHeader icon="file" title="Document Management">
          <input className="admin-filter-input" />
          <AdminSearch placeholder="Search documents..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Uploader</th><th>Upload Date</th><th>Downloads</th><th>Status</th><th>Actions</th></tr></thead>
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
        <AdminSectionHeader icon="book" title="Subject Management">
          <button className="admin-primary" onClick={onAdd} type="button"><StudyHubIcon name="plus" size={18} /> Add Subject</button>
        </AdminSectionHeader>
        <div className="admin-search-row">
          <AdminSearch placeholder="Search subjects..." />
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
              <footer><span>{count} documents</span><button type="button">View →</button></footer>
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
        <StorageMetric tone="blue" label="Total Storage" value="500 GB" />
        <StorageMetric tone="green" label="Used" value="287 GB" sub="57.4%" />
        <StorageMetric tone="purple" label="Free" value="213 GB" sub="42.6%" />
      </div>
      <div className="admin-chart-grid">
        <section className="admin-card storage-bars">
          <h2>Storage Allocation</h2>
          {[
            ['PDF', '125 GB (43%)', 78, 'red'],
            ['Word/PowerPoint', '89 GB (31%)', 56, 'blue'],
            ['ZIP/RAR', '56 GB (19%)', 34, 'green'],
            ['Others', '17 GB (7%)', 14, 'gray'],
          ].map(([label, value, width, tone]) => (
            <div className="storage-row" key={label}><span>{label}</span><small>{value}</small><i className={tone} style={{ width: `${width}%` }} /></div>
          ))}
        </section>
        <AdminChart title="Usage Trend (30 Days)" type="area" />
      </div>
      <section className="admin-card admin-table-card">
        <h2>Largest Files</h2>
        <table className="admin-table">
          <thead><tr><th>File Name</th><th>Uploader</th><th>Size</th><th>Type</th></tr></thead>
          <tbody>
            {[
              ['SWP391-Complete-Project.zip', 'Nguyen Van A', '245 MB', 'ZIP'],
              ['CEA201-Full-Course-Slides.pdf', 'Tran Thi B', '189 MB', 'PDF'],
              ['PRF192-Video-Lectures.zip', 'Le Van C', '167 MB', 'ZIP'],
            ].map(([name, owner, size, type]) => <tr key={name}><td>{name}</td><td>{owner}</td><td>{size}</td><td><Badge tone="blue">{type}</Badge></td></tr>)}
          </tbody>
        </table>
      </section>
    </main>
  )
}

function AdminReports() {
  const rows = [
    ['Nguyen Van A', 'Tran Thi B', 'Inappropriate content', '28/5/2024', 'pending'],
    ['Le Van C', 'Pham Van D', 'Copyright infringement', '27/5/2024', 'rejected'],
    ['Hoang Thi E', 'Nguyen Van F', 'Spam', '26/5/2024', 'approved'],
    ['Tran Van G', 'Le Thị H', 'Harassment', '25/5/2024', 'rejected'],
  ]
  return (
    <main className="admin-page">
      <section className="admin-card admin-table-card">
        <AdminSectionHeader icon="flag" title="Reports">
          <input className="admin-filter-input" />
          <AdminSearch placeholder="Search reports..." />
        </AdminSectionHeader>
        <table className="admin-table">
          <thead><tr><th>Reporter</th><th>Violator</th><th>Violation Type</th><th>Report Date</th><th>Status</th><th>Actions</th></tr></thead>
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
        <AdminLogItem tone="blue" title="New User Registration" text="Nguyen Van A (studenta@fpt.edu.vn)" time="2 minutes ago" />
        <AdminLogItem tone="green" title="New Document Uploaded" text="CEA201 - Chapter 5: Cache Memory" time="15 minutes ago" />
        <AdminLogItem tone="green" title="Document Approved" text="PRF192 - Assignment Solution" time="1 hour ago" />
        <AdminLogItem tone="red" title="User Suspended" text="Le Van C - Policy Violation" time="2 hours ago" />
        <AdminLogItem tone="purple" title="System Backup Completed" text="Database backup - 287GB" time="3 hours ago" />
        <AdminLogItem tone="orange" title="Document Rejected" text="PRO192 - Plagiarized content detected" time="5 hours ago" />
        <AdminLogItem tone="blue" title="Admin Logged In" text="Admin Dashboard access" time="8 hours ago" />
      </section>
    </main>
  )
}

function AdminSettings() {
  return (
    <main className="admin-page settings-page">
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="sparkle" size={18} /> General Settings</h2>
        <label>System Name<input defaultValue="AI Study Hub" /></label>
        <label>Contact Email<input defaultValue="admin@aistudyhub.com" /></label>
        <label>Max File Size (MB)<input defaultValue="50" /></label>
        <SettingToggle title="Auto-approve documents" text="Bypass manual review process" />
        <SettingToggle title="Allow new registrations" text="Users can create new accounts" active />
        <button className="admin-primary" type="button"><StudyHubIcon name="file" size={16} /> Save Settings</button>
      </section>
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="lock" size={18} /> Security</h2>
        <SettingAction title="Change Admin Password" text="Update login password" icon="edit" />
        <SettingAction title="Session Management" text="View and sign out active sessions" icon="eye" />
        <SettingAction danger title="Delete All Data" text="Permanently delete all system data" icon="archive" />
      </section>
    </main>
  )
}

function AdminChart({ title, type }) {
  return (
    <section className={`admin-card admin-chart admin-chart--${type}`}>
      <h2>{title}</h2>
      {type === 'pie' ?<div className="fake-pie" /> : <div className="fake-chart">{[35, 48, 66, 60, 78, 56, 40].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>}
      <small>{type === 'pie' ? 'CEA201 19% · PRF192 16% · Others 30%' : 'Uploads → Downloads'}</small>
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
  const labels = { active: 'Active', blocked: 'Banned', suspended: 'Suspended', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }
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
        <h2>Account Details</h2>
        <div className="admin-user-profile"><span>{user.initial}</span><div><h3>{user.name}</h3><p>Joined: {user.joined}</p></div></div>
        <div className="admin-detail-grid">
          <InfoBlock label="Email" value={user.email} />
          <InfoBlock label="Phone Number" value="0912345678" />
          <InfoBlock label="Gender" value="Male" />
          <InfoBlock label="Date of Birth" value="15/03/2002" />
          <InfoBlock label="Address" value="123 Nguyen Hue, Dist.1, HCMC" />
        </div>
        <footer><p><small>Account Status</small><strong className="green-text">Active</strong></p><p><small>Total Documents</small><strong className="purple-text">{user.docs}</strong></p></footer>
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
        <h2>{edit ? 'Edit Subject' : 'Add New Subject'}</h2>
        <label>Course Code<input placeholder="e.g. CEA201" defaultValue={edit ? 'CEA201' : ''} /></label>
        <label>Course Name<input placeholder="e.g. Computer Architecture" defaultValue={edit ? 'Computer Architecture' : ''} /></label>
        <label>Semester<input placeholder="e.g. Semester 3" defaultValue={edit ? 'Semester 3' : ''} /></label>
        <label>Major<input placeholder="e.g. SE" defaultValue={edit ? 'SE' : ''} /></label>
        <footer><button onClick={onClose} type="button">Cancel</button><button className="dark-button" type="button">{edit ? 'Update' : 'Add Subject'}</button></footer>
      </section>
    </div>
  )
}
