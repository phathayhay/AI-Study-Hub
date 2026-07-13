import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/api'

export const adminCourseApi = {
  list: () => apiGet('/admin/courses'),
  create: (body) => apiPost('/admin/courses', body),
  update: (id, body) => apiPut(`/admin/courses/${id}`, body),
  remove: (id) => apiDelete(`/admin/courses/${id}`),
}

