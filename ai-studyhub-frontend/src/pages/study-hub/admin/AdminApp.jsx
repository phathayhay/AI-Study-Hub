import { useState } from 'react'
import { AdminLayout } from '../../../features/admin/components/AdminLayout'
import { AdminCourseModal } from '../../../features/admin/components/modals/AdminCourseModal'
import { AdminUserModal } from '../../../features/admin/components/modals/AdminUserModal'
import AdminOverviewPage from './AdminOverviewPage'
import AdminUsersPage from './AdminUsersPage'
import AdminDocumentsPage from './AdminDocumentsPage'
import AdminCoursesPage from './AdminCoursesPage'
import AdminStoragePage from './AdminStoragePage'
import AdminReportsPage from './AdminReportsPage'
import AdminLogsPage from './AdminLogsPage'
import AdminSettingsPage from './AdminSettingsPage'
import { ADMIN_ROUTES } from '../../../features/admin/constants/adminRoutes'

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
