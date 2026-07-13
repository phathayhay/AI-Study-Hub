import { ADMIN_PERMISSIONS } from './adminPermissions'
import { ADMIN_ROUTES, ADMIN_ROUTE_PATHS } from './adminRoutes'

export const adminNavigation = [
  { id: ADMIN_ROUTES.overview, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.overview], label: 'Overview', icon: 'trend' },
  { id: ADMIN_ROUTES.users, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.users], label: 'Users', icon: 'users', permission: ADMIN_PERMISSIONS.VIEW_USERS },
  { id: ADMIN_ROUTES.documents, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.documents], label: 'Documents', icon: 'file', permission: ADMIN_PERMISSIONS.VIEW_DOCUMENTS },
  { id: ADMIN_ROUTES.courses, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.courses], label: 'Courses', icon: 'book', permission: ADMIN_PERMISSIONS.MANAGE_COURSES },
  { id: ADMIN_ROUTES.storage, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.storage], label: 'Storage', icon: 'archive' },
  { id: ADMIN_ROUTES.reports, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.reports], label: 'Reports', icon: 'flag', permission: ADMIN_PERMISSIONS.MANAGE_REPORTS },
  { id: ADMIN_ROUTES.logs, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.logs], label: 'Activity Logs', icon: 'trend', permission: ADMIN_PERMISSIONS.VIEW_LOGS },
  { id: ADMIN_ROUTES.settings, path: ADMIN_ROUTE_PATHS[ADMIN_ROUTES.settings], label: 'Settings', icon: 'sparkle', permission: ADMIN_PERMISSIONS.MANAGE_SETTINGS },
]

