const DEFAULT_API_BASE_URL = 'https://ai-study-hub-mpmz.onrender.com'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = (
  configuredApiBaseUrl || (import.meta.env.DEV ? '' : DEFAULT_API_BASE_URL)
).replace(/\/$/, '')

function getAccessToken() {
  return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken')
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  const isFormData = options.body instanceof FormData

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = data?.message || data?.error || data || `Request failed (${response.status})`
    throw new ApiError(message, response.status, data)
  }

  if (response.status === 204) return null
  const isWrapped = data
    && typeof data === 'object'
    && typeof data.success === 'boolean'
    && Object.prototype.hasOwnProperty.call(data, 'message')

  return isWrapped && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: 'GET' })
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  })
}

export function apiPut(path, body, options = {}) {
  return apiRequest(path, {
    ...options,
    method: 'PUT',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiDelete(path, options) {
  return apiRequest(path, { ...options, method: 'DELETE' })
}

export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, value)
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}
