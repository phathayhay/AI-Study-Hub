import { apiDelete, apiGet, apiPost, apiPut } from './api'

export function getAdminUsers() {
  return apiGet('/api/admin/users')
}

export function banAdminUser(userId) {
  return apiPost(`/api/admin/users/${userId}/ban`, {})
}

export function unbanAdminUser(userId) {
  return apiPost(`/api/admin/users/${userId}/unban`, {})
}

export function getAdminDocuments() {
  return apiGet('/api/admin/documents')
}

export function moderateAdminDocument(documentId, status) {
  return apiPost(`/api/admin/documents/${documentId}/moderate`, { status })
}

export function getAdminReports() {
  return apiGet('/api/admin/reports')
}

export function resolveAdminReport(reportId, status, deleteDocument = false) {
  return apiPost(`/api/admin/reports/${reportId}/resolve`, { status, deleteDocument })
}

export function getAdminCourses() {
  return apiGet('/api/admin/courses')
}

export function createAdminCourse(course) {
  return apiPost('/api/admin/courses', course)
}

export function updateAdminCourse(courseId, course) {
  return apiPut(`/api/admin/courses/${courseId}`, course)
}

export function deleteAdminCourse(courseId) {
  return apiDelete(`/api/admin/courses/${courseId}`)
}

export function getAdminMajors() {
  return apiGet('/api/admin/majors')
}

export function getAdminCategories() {
  return apiGet('/api/admin/categories')
}

export function getPendingAdminVerifications() {
  return apiGet('/api/admin/verifications/pending')
}

export function reviewAdminVerification(verificationId, status, reviewNote = '') {
  return apiPost(`/api/admin/verifications/${verificationId}/review`, { status, reviewNote })
}

export function getAdminPlans() {
  return apiGet('/api/admin/plans')
}
