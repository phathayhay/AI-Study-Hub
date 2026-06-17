import { apiGet, apiPost, buildQueryString } from '../../services/api'

const USER_KEY = 'authUser'

function clearAuthStorage(storage) {
  storage.removeItem('accessToken')
  storage.removeItem('refreshToken')
  storage.removeItem(USER_KEY)
}

function saveSession(session, remember = true) {
  clearAuthStorage(localStorage)
  clearAuthStorage(sessionStorage)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('accessToken', session.accessToken)
  storage.setItem('refreshToken', session.refreshToken)
  storage.setItem(USER_KEY, JSON.stringify({
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    studentCode: session.studentCode,
  }))
  return session
}

export async function login(credentials, remember = true) {
  return saveSession(await apiPost('/api/auth/login', credentials), remember)
}

export async function register(data) {
  return saveSession(await apiPost('/api/auth/register', data))
}

export async function refreshSession() {
  const refreshToken = localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('Không có refresh token.')
  const remember = Boolean(localStorage.getItem('refreshToken'))
  return saveSession(await apiPost('/api/auth/refresh', { refreshToken }), remember)
}

export async function logout() {
  const refreshToken = localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken')
  try {
    if (refreshToken) await apiPost('/api/auth/logout', { refreshToken })
  } finally {
    clearAuthStorage(localStorage)
    clearAuthStorage(sessionStorage)
  }
}

export function getStoredUser() {
  const value = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    clearAuthStorage(localStorage)
    clearAuthStorage(sessionStorage)
    return null
  }
}

export function forgotPassword(email) {
  return apiPost('/api/auth/forgot-password', { email })
}

export function resetPassword(token, newPassword) {
  return apiPost('/api/auth/reset-password', { token, newPassword })
}

export function changePassword(oldPassword, newPassword) {
  return apiPost('/api/auth/change-password', {
    oldPassword,
    newPassword,
    confirmPassword: newPassword,
  })
}

export function verifyEmail(token) {
  return apiGet(`/api/auth/verify-email${buildQueryString({ token })}`)
}
