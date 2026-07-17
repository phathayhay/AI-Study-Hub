const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const AUTH_PERSIST_KEY = 'authPersistence'
const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'
let refreshPromise = null

export class ApiError extends Error {
  constructor(message, status, data, request = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.method = request.method
    this.path = request.path
    this.url = request.url
  }
}

export function getAuthStorage() {
  return localStorage.getItem(AUTH_PERSIST_KEY) === 'session' ? sessionStorage : localStorage
}

export function getToken() {
  return getAuthStorage().getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return getAuthStorage().getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser() {
  return getAuthStorage().getItem(USER_KEY) || localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
}

export function persistAuthSession(user, remember = true) {
  const targetStorage = remember ? localStorage : sessionStorage
  const otherStorage = remember ? sessionStorage : localStorage

  localStorage.setItem(AUTH_PERSIST_KEY, remember ? 'local' : 'session')
  otherStorage.removeItem(TOKEN_KEY)
  otherStorage.removeItem(REFRESH_TOKEN_KEY)
  otherStorage.removeItem(USER_KEY)

  targetStorage.setItem(TOKEN_KEY, user.accessToken)
  if (user.refreshToken) {
    targetStorage.setItem(REFRESH_TOKEN_KEY, user.refreshToken)
  } else {
    targetStorage.removeItem(REFRESH_TOKEN_KEY)
  }
  targetStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_PERSIST_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function getRememberPreference() {
  return localStorage.getItem(AUTH_PERSIST_KEY) !== 'session'
}

function buildRefreshedSession(currentUser, payload) {
  const refreshedUser = payload?.data || payload
  if (!refreshedUser?.accessToken) return null

  return {
    ...(currentUser || {}),
    ...refreshedUser,
  }
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAuthSession()
    return null
  }

  refreshPromise = (async () => {
    const url = `${API_BASE}/auth/refresh`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    const ct = res.headers.get('content-type') || ''
    const payload = ct.includes('application/json') ? await res.json() : await res.text()

    if (!res.ok) {
      clearAuthSession()
      throw new ApiError(payload?.message || `HTTP ${res.status}`, res.status, payload, {
        method: 'POST',
        path: '/auth/refresh',
        url,
      })
    }

    let currentUser = null
    try {
      const savedUser = getStoredUser()
      currentUser = savedUser ? JSON.parse(savedUser) : null
    } catch {
      currentUser = null
    }

    const nextSessionUser = buildRefreshedSession(currentUser, payload)
    if (!nextSessionUser) {
      clearAuthSession()
      return null
    }

    persistAuthSession(nextSessionUser, getRememberPreference())
    return nextSessionUser
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function buildHeaders(body, opts = {}) {
  const headers = new Headers(opts.headers)
  const token = getToken()
  const isFormData = body instanceof FormData
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return headers
}

async function request(method, path, body, opts = {}) {
  const url = `${API_BASE}${path}`
  const headers = buildHeaders(body, opts)
  let res
  try {
    res = await fetch(url, { method, headers, body, ...opts })
  } catch (err) {
    console.error(`[API] Network error ${method} ${url}:`, err)
    throw new Error(`Unable to connect to the server (${err.message})`, { cause: err })
  }

  if (
    res.status === 401
    && !opts._retriedAfterRefresh
    && !path.startsWith('/auth/')
    && getRefreshToken()
  ) {
    try {
      const refreshedSession = await refreshAccessToken()
      if (refreshedSession?.accessToken) {
        return request(method, path, body, { ...opts, _retriedAfterRefresh: true })
      }
    } catch (refreshError) {
      console.error(`[API] Token refresh failed before retrying ${method} ${url}:`, refreshError)
    }
  }

  const ct = res.headers.get('content-type') || ''
  let data
  try {
    data = ct.includes('application/json') ? await res.json() : await res.text()
  } catch (parseErr) {
    console.error(`[API] Parse error ${method} ${url}:`, parseErr)
    throw new Error('Error reading response from server', { cause: parseErr })
  }
  if (!res.ok) throw new ApiError(data?.message || `HTTP ${res.status}`, res.status, data, { method, path, url })
  return res.status === 204 ? null : data
}

export async function apiDownload(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const headers = buildHeaders(null, opts)
  let res
  try {
    res = await fetch(url, { method: 'GET', headers, ...opts })
  } catch (err) {
    console.error(`[API] Network error GET ${url}:`, err)
    throw new Error(`Unable to connect to the server (${err.message})`, { cause: err })
  }

  if (
    res.status === 401
    && !opts._retriedAfterRefresh
    && !path.startsWith('/auth/')
    && getRefreshToken()
  ) {
    try {
      const refreshedSession = await refreshAccessToken()
      if (refreshedSession?.accessToken) {
        return apiDownload(path, { ...opts, _retriedAfterRefresh: true })
      }
    } catch (refreshError) {
      console.error(`[API] Token refresh failed before retrying GET ${url}:`, refreshError)
    }
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') || ''
    let data
    try {
      data = ct.includes('application/json') ? await res.json() : await res.text()
    } catch {
      data = null
    }
    throw new ApiError(data?.message || `HTTP ${res.status}`, res.status, data, { method: 'GET', path, url })
  }

  return {
    blob: await res.blob(),
    contentDisposition: res.headers.get('content-disposition') || '',
    contentType: res.headers.get('content-type') || ''
  }
}

export function apiGet(path, opts) { return request('GET', path, null, opts) }
export function apiPost(path, body, opts) { return request('POST', path, body instanceof FormData ? body : JSON.stringify(body), opts) }
export function apiPut(path, body, opts) { return request('PUT', path, body ? JSON.stringify(body) : null, opts) }
export function apiDelete(path, opts) { return request('DELETE', path, null, opts) }

export function uploadFileWithProgress(path, fileOrFormData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${API_BASE}${path}`
    
    xhr.open('POST', url)
    
    const token = getToken()
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          onProgress(percentage)
        }
      }
    }
    
    xhr.onload = () => {
      const ct = xhr.getResponseHeader('content-type') || ''
      let data
      try {
        data = ct.includes('application/json') ? JSON.parse(xhr.responseText) : xhr.responseText
      } catch (e) {
        data = xhr.responseText
      }
      
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data)
      } else {
        reject(new ApiError(data?.message || `HTTP ${xhr.status}`, xhr.status, data))
      }
    }
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload.'))
    }
    
    let formData
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData
    } else {
      formData = new FormData()
      formData.append('file', fileOrFormData)
    }
    
    xhr.send(formData)
  })
}

