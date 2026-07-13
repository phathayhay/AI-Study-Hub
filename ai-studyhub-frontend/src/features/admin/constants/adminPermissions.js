export const ADMIN_PERMISSIONS = {
  VIEW_USERS: 'admin.users.view',
  MANAGE_USERS: 'admin.users.manage',
  VIEW_DOCUMENTS: 'admin.documents.view',
  MANAGE_DOCUMENTS: 'admin.documents.manage',
  MANAGE_COURSES: 'admin.courses.manage',
  MANAGE_REPORTS: 'admin.reports.manage',
  VIEW_LOGS: 'admin.logs.view',
  MANAGE_SETTINGS: 'admin.settings.manage',
}

export function hasRole(user, role) {
  const currentRole = user?.role || user?.roleName || user?.authority || ''
  return String(currentRole).toUpperCase().replace(/^ROLE_/, '') === String(role).toUpperCase().replace(/^ROLE_/, '')
}

export function hasPermission(user, permission) {
  if (hasRole(user, 'ADMIN')) return true
  return Array.isArray(user?.permissions) && user.permissions.includes(permission)
}

