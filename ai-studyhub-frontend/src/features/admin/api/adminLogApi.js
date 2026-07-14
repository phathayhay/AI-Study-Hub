import { apiDownload, apiGet } from '../../../services/api'

function toQueryString(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const queryString = search.toString()
  return queryString ? `?${queryString}` : ''
}

export const adminLogApi = {
  list: (params = {}) => apiGet(`/admin/activity-logs${toQueryString(params)}`),
  export: (params = {}) => apiDownload(`/admin/activity-logs/export${toQueryString(params)}`),
}

