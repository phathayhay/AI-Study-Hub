import { adminCategoryApi, adminMajorApi, adminPlanApi } from './api/adminPlanApi'
import { adminCourseApi } from './api/adminCourseApi'
import { adminDashboardApi } from './api/adminDashboardApi'
import { adminDocumentApi } from './api/adminDocumentApi'
import { adminLogApi } from './api/adminLogApi'
import { adminReportApi } from './api/adminReportApi'
import { adminUserApi } from './api/adminUserApi'

// Backward-compatible exports for screens that are being migrated incrementally.
export const getAdminUsers = adminUserApi.list
export const banAdminUser = adminUserApi.ban
export const unbanAdminUser = adminUserApi.unban

export const getAdminDocuments = adminDocumentApi.list
export const moderateAdminDocument = adminDocumentApi.moderate

export const getAdminReports = adminReportApi.list
export const getAdminReportDetail = adminReportApi.getById
export const resolveAdminReport = adminReportApi.resolve
export const getPendingVerifications = adminReportApi.pendingVerifications
export const reviewVerification = adminReportApi.reviewVerification

export const getAdminPlans = adminPlanApi.list
export const createAdminPlan = adminPlanApi.create
export const updateAdminPlan = adminPlanApi.update
export const deleteAdminPlan = adminPlanApi.remove

export const getAdminMajors = adminMajorApi.list
export const createAdminMajor = adminMajorApi.create
export const updateAdminMajor = adminMajorApi.update
export const deleteAdminMajor = adminMajorApi.remove

export const getAdminCourses = adminCourseApi.list
export const createAdminCourse = adminCourseApi.create
export const updateAdminCourse = adminCourseApi.update
export const deleteAdminCourse = adminCourseApi.remove

export const getAdminCategories = adminCategoryApi.list
export const createAdminCategory = adminCategoryApi.create
export const updateAdminCategory = adminCategoryApi.update
export const deleteAdminCategory = adminCategoryApi.remove

export const getAdminDashboardAnalytics = adminDashboardApi.analytics
export const getAdminActivityLogs = adminLogApi.list
export const exportAdminActivityLogs = adminLogApi.export
export const getAdminDashboardData = adminDashboardApi.all
