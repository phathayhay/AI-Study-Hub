import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/api'

export const adminPlanApi = {
  list: () => apiGet('/admin/plans'),
  create: (body) => apiPost('/admin/plans', body),
  update: (id, body) => apiPut(`/admin/plans/${id}`, body),
  remove: (id) => apiDelete(`/admin/plans/${id}`),
}

export const adminMajorApi = {
  list: () => apiGet('/admin/majors'),
  create: (body) => apiPost('/admin/majors', body),
  update: (id, body) => apiPut(`/admin/majors/${id}`, body),
  remove: (id) => apiDelete(`/admin/majors/${id}`),
}

export const adminCategoryApi = {
  list: () => apiGet('/admin/categories'),
  create: (body) => apiPost('/admin/categories', body),
  update: (id, body) => apiPut(`/admin/categories/${id}`, body),
  remove: (id) => apiDelete(`/admin/categories/${id}`),
}

