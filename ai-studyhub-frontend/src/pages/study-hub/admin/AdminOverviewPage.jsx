import { useCallback, useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { getAdminDashboardData } from '../../../features/admin/adminService'
import { formatBytes, formatDateTime, getInitial } from '../../../features/admin/utils/adminFormatters'
import { formatAdminError, normalizeStatus, unwrapList, unwrapPayload } from '../../../features/admin/utils/adminNormalizers'
import { AdminChart, AdminLogItem, AdminStatus, AdminTableState } from '../../../features/admin/components/legacyShared'

export function AdminOverview({ onOpenUser }) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const isMountedRef = useRef(true)

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setState((current) => ({ ...current, error: '', loading: true }))
    }
    try {
      const response = await getAdminDashboardData()
      if (!isMountedRef.current) return
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
      if (!isMountedRef.current) return
      setState((current) => ({
        data: current.data,
        error: formatAdminError(err),
        loading: false,
      }))
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    loadDashboard(true)
    const refreshTimer = window.setInterval(() => {
      loadDashboard(false)
    }, 30000)
    const handleVisibilityChange = () => {
      if (window.document.visibilityState === 'visible') {
        loadDashboard(false)
      }
    }
    window.addEventListener('focus', handleVisibilityChange)
    window.document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMountedRef.current = false
      window.clearInterval(refreshTimer)
      window.removeEventListener('focus', handleVisibilityChange)
      window.document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadDashboard])

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


export default AdminOverview
