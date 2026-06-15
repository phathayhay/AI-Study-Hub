const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getToken() {
  return localStorage.getItem('accessToken')
}

async function request(method, path, body, opts = {}) {
  const headers = new Headers(opts.headers)
  const token = getToken()
  const isFormData = body instanceof FormData
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body, ...opts })
  const ct = res.headers.get('content-type') || ''
  const data = ct.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw new ApiError(data?.message || data, res.status, data)
  return res.status === 204 ? null : data
}

export function apiGet(path, opts) { return request('GET', path, null, opts) }
export function apiPost(path, body, opts) { return request('POST', path, body instanceof FormData ? body : JSON.stringify(body), opts) }
export function apiPut(path, body, opts) { return request('PUT', path, body ? JSON.stringify(body) : null, opts) }
export function apiDelete(path, opts) { return request('DELETE', path, null, opts) }