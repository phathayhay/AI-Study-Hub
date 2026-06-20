import { apiDelete, apiGet, apiPost, apiPut } from '../../services/api'

export function getAdminUsers() {
  return apiGet('/admin/users')
}

export function banAdminUser(id) {
  return apiPost(`/admin/users/${id}/ban`)
}

export function unbanAdminUser(id) {
  return apiPost(`/admin/users/${id}/unban`)
}

export function getAdminDocuments() {
  return apiGet('/admin/documents')
}

export function moderateAdminDocument(id, status) {
  return apiPost(`/admin/documents/${id}/moderate`, { status })
}

export function getAdminReports() {
  return apiGet('/admin/reports')
}

export function resolveAdminReport(id, status, deleteDocument = false) {
  return apiPost(`/admin/reports/${id}/resolve`, { status, deleteDocument })
}

export function getPendingVerifications() {
  return apiGet('/admin/verifications/pending')
}

export function reviewVerification(id, status, reviewNote = '') {
  return apiPost(`/admin/verifications/${id}/review`, { status, reviewNote })
}

export function getAdminPlans() {
  return apiGet('/admin/plans')
}

export function createAdminPlan(body) {
  return apiPost('/admin/plans', body)
}

export function updateAdminPlan(id, body) {
  return apiPut(`/admin/plans/${id}`, body)
}

export function deleteAdminPlan(id) {
  return apiDelete(`/admin/plans/${id}`)
}

export function getAdminMajors() {
  return apiGet('/admin/majors')
}

export function createAdminMajor(body) {
  return apiPost('/admin/majors', body)
}

export function updateAdminMajor(id, body) {
  return apiPut(`/admin/majors/${id}`, body)
}

export function deleteAdminMajor(id) {
  return apiDelete(`/admin/majors/${id}`)
}

export function getAdminCourses() {
  return apiGet('/admin/courses')
}

export function createAdminCourse(body) {
  return apiPost('/admin/courses', body)
}

export function updateAdminCourse(id, body) {
  return apiPut(`/admin/courses/${id}`, body)
}

export function deleteAdminCourse(id) {
  return apiDelete(`/admin/courses/${id}`)
}

export function getAdminCategories() {
  return apiGet('/admin/categories')
}

export function createAdminCategory(body) {
  return apiPost('/admin/categories', body)
}

export function updateAdminCategory(id, body) {
  return apiPut(`/admin/categories/${id}`, body)
}

export function deleteAdminCategory(id) {
  return apiDelete(`/admin/categories/${id}`)
}

export function getAdminDashboardData() {
  return Promise.all([
    getAdminUsers(),
    getAdminDocuments(),
    getAdminReports(),
    getPendingVerifications(),
    getAdminPlans(),
    getAdminMajors(),
    getAdminCourses(),
    getAdminCategories(),
  ]).then(([users, documents, reports, verifications, plans, majors, courses, categories]) => ({
    users,
    documents,
    reports,
    verifications,
    plans,
    majors,
    courses,
    categories,
  }))
}
