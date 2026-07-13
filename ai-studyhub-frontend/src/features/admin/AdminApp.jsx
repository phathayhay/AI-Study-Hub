import { useState } from 'react'
import { AdminLayout } from './components/AdminLayout'
import { AdminCourseModal } from './components/modals/AdminCourseModal'
import { AdminUserModal } from './components/modals/AdminUserModal'
import AdminOverviewPage from './pages/AdminOverviewPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminDocumentsPage from './pages/AdminDocumentsPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import AdminStoragePage from './pages/AdminStoragePage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminLogsPage from './pages/AdminLogsPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import { ADMIN_ROUTES } from './constants/adminRoutes'

const pageByRoute = {
  [ADMIN_ROUTES.overview]: AdminOverviewPage,
  [ADMIN_ROUTES.users]: AdminUsersPage,
  [ADMIN_ROUTES.documents]: AdminDocumentsPage,
  [ADMIN_ROUTES.courses]: AdminCoursesPage,
  [ADMIN_ROUTES.storage]: AdminStoragePage,
  [ADMIN_ROUTES.reports]: AdminReportsPage,
  [ADMIN_ROUTES.logs]: AdminLogsPage,
  [ADMIN_ROUTES.settings]: AdminSettingsPage,
}

export function AdminApp({ route, onNavigate, onLogout }) {
  const [userModal, setUserModal] = useState(null)
  const [courseModal, setCourseModal] = useState(null)
  const Page = pageByRoute[route] || AdminOverviewPage

  return (
    <AdminLayout active={route} onNavigate={onNavigate} onLogout={onLogout}>
      <Page onOpenUser={setUserModal} onEdit={setCourseModal} onNavigate={onNavigate} />
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

export default AdminApp

