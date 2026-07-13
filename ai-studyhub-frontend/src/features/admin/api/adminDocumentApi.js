import { apiGet, apiPost } from '../../../services/api'

export const adminDocumentApi = {
  list: () => apiGet('/admin/documents'),
  moderate: (id, status) => apiPost(`/admin/documents/${id}/moderate`, { status }),
}

