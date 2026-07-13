import { apiGet, apiPost } from '../../../services/api'

export const adminReportApi = {
  list: () => apiGet('/admin/reports'),
  getById: (id) => apiGet(`/admin/reports/${id}`),
  resolve: (id, status, deleteDocument = false) => apiPost(`/admin/reports/${id}/resolve`, { status, deleteDocument }),
  pendingVerifications: () => apiGet('/admin/verifications/pending'),
  reviewVerification: (id, status, reviewNote = '') => apiPost(`/admin/verifications/${id}/review`, { status, reviewNote }),
}

