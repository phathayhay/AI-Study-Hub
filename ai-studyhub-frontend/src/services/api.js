const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

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
  const url = `${API_BASE}${path}`
  const headers = new Headers(opts.headers)
  const token = getToken()
  const isFormData = body instanceof FormData
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  let res
  try {
    res = await fetch(url, { method, headers, body, ...opts })
  } catch (err) {
    console.error(`[API] Network error ${method} ${url}:`, err)
    throw new Error(`Không thể kết nối đến server (${err.message})`)
  }
  const ct = res.headers.get('content-type') || ''
  let data
  try {
    data = ct.includes('application/json') ? await res.json() : await res.text()
  } catch (parseErr) {
    console.error(`[API] Parse error ${method} ${url}:`, parseErr)
    throw new Error(`Lỗi đọc phản hồi từ server`)
  }
  if (!res.ok) throw new ApiError(data?.message || `HTTP ${res.status}`, res.status, data)
  return res.status === 204 ? null : data
}

export function apiGet(path, opts) { return request('GET', path, null, opts) }
export function apiPost(path, body, opts) { return request('POST', path, body instanceof FormData ? body : JSON.stringify(body), opts) }
export function apiPut(path, body, opts) { return request('PUT', path, body ? JSON.stringify(body) : null, opts) }
export function apiDelete(path, opts) { return request('DELETE', path, null, opts) }
