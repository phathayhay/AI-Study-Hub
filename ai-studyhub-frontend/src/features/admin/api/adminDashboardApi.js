import { apiGet } from '../../../services/api'
import { adminCategoryApi, adminMajorApi, adminPlanApi } from './adminPlanApi'
import { adminDocumentApi } from './adminDocumentApi'
import { adminCourseApi } from './adminCourseApi'
import { adminReportApi } from './adminReportApi'
import { adminUserApi } from './adminUserApi'

export const adminDashboardApi = {
  analytics: () => apiGet('/admin/dashboard/analytics'),
  all: () => Promise.all([
    adminUserApi.list(),
    adminDocumentApi.list(),
    adminReportApi.list(),
    adminReportApi.pendingVerifications(),
    adminPlanApi.list(),
    adminMajorApi.list(),
    adminCourseApi.list(),
    adminCategoryApi.list(),
    adminDashboardApi.analytics(),
  ]).then(([users, documents, reports, verifications, plans, majors, courses, categories, analytics]) => ({
    users,
    documents,
    reports,
    verifications,
    plans,
    majors,
    courses,
    categories,
    analytics,
  })),
}
