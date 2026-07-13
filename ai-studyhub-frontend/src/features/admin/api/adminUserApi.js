import { apiGet, apiPost } from '../../../services/api'

export const adminUserApi = {
  list: () => apiGet('/admin/users'),
  ban: (id) => apiPost(`/admin/users/${id}/ban`),
  unban: (id) => apiPost(`/admin/users/${id}/unban`),
}

