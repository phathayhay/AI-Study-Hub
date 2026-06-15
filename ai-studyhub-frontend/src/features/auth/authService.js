import { apiPost } from '../../services/api'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'

function getStorage(remember) {
  return remember ? localStorage : sessionStorage
}

function clearStorage(storage) {
  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
  storage.removeItem(USER_KEY)
}

function saveSession(session, remember = true) {
  clearStorage(localStorage)
  clearStorage(sessionStorage)

  const storage = getStorage(remember)
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  storage.setItem(USER_KEY, JSON.stringify({
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    studentCode: session.studentCode,
  }))

  return session
}

export async function login(credentials, remember = true) {
  const session = await apiPost('/api/auth/login', credentials)
  return saveSession(session, remember)
}

export async function register(data) {
  const session = await apiPost('/api/auth/register', data)
  return saveSession(session)
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    ?? sessionStorage.getItem(REFRESH_TOKEN_KEY)

  try {
    if (refreshToken) {
      await apiPost('/api/auth/logout', { refreshToken })
    }
  } finally {
    clearStorage(localStorage)
    clearStorage(sessionStorage)
  }
}

export function getStoredUser() {
  const value = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    clearStorage(localStorage)
    clearStorage(sessionStorage)
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
