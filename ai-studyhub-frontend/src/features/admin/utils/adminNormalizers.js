export function unwrapPayload(response) {
  return response?.data ?? response ?? null
}

export function unwrapList(response) {
  const data = unwrapPayload(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  return []
}

export function unwrapPage(response) {
  const data = unwrapPayload(response)
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || 0),
    size: Number(data?.size || 10),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
    last: Boolean(data?.last),
  }
}

export function normalizeStatus(value) {
  return String(value || 'pending').toLowerCase()
}

export function formatAdminError(err) {
  const target = err?.path ? `${err.method || 'GET'} ${err.path}` : 'admin data'
  if (err?.status >= 500) return `Server error while loading ${target}. Please check the backend logs.`
  if (err?.status === 403) return `You do not have permission to load ${target}. Please sign in with an admin account.`
  if (err?.status === 401) return `Your session expired while loading ${target}. Please sign in again.`
  return err?.message || 'Unable to load admin data'
}

