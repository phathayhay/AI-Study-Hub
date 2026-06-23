export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  EXPLORE: '/explore',
  LIBRARY: '/library',
  UPLOAD: '/upload',
  NEW_STUDY_SESSION: '/study/new',
  PROFILE: '/profile',
  PRICING: '/pricing',
  FOLDER_DETAIL: '/folders/:folderId',
  DOCUMENT_DETAIL: '/documents/:documentId',
  STUDY_DOCUMENT: '/study/:documentId',
  ADMIN_OVERVIEW: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_STORAGE: '/admin/storage',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_SETTINGS: '/admin/settings',
}

export const APP_ROUTE_PATTERNS = Object.values(ROUTES)

export const ROUTE_PATHS = {
  'guest-home': ROUTES.HOME,
  home: ROUTES.HOME,
  login: ROUTES.LOGIN,
  register: ROUTES.REGISTER,
  explore: ROUTES.EXPLORE,
  library: ROUTES.LIBRARY,
  upload: ROUTES.UPLOAD,
  profile: ROUTES.PROFILE,
  pricing: ROUTES.PRICING,
  'admin-overview': ROUTES.ADMIN_OVERVIEW,
  'admin-users': ROUTES.ADMIN_USERS,
  'admin-documents': ROUTES.ADMIN_DOCUMENTS,
  'admin-courses': ROUTES.ADMIN_COURSES,
  'admin-storage': ROUTES.ADMIN_STORAGE,
  'admin-reports': ROUTES.ADMIN_REPORTS,
  'admin-logs': ROUTES.ADMIN_LOGS,
  'admin-settings': ROUTES.ADMIN_SETTINGS,
}

export function fillRoute(pattern, params = {}) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodeURIComponent(value)),
    pattern,
  )
}
