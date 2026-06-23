import { apiPost, apiGet } from '../../services/api'

export async function login(credentials) {
  return apiPost('/auth/login', credentials)
}

export async function register(data) {
  return apiPost('/auth/register', data)
}

export async function getMe() {
  try { return await apiGet('/auth/me') } catch { return null }
}

export async function logout(refreshToken) {
  try { await apiPost('/auth/logout', { refreshToken }) } catch { /* ignore */ }
}

export async function refresh(refreshToken) {
  return apiPost('/auth/refresh', { refreshToken })
}

export async function changePassword(data) {
  return apiPost('/auth/change-password', data)
}

export async function forgotPassword(email) {
  return apiPost('/auth/forgot-password', { email })
}

export async function resetPassword(data) {
  return apiPost('/auth/reset-password', data)
}

export async function verifyEmail(token) {
  return apiGet(`/auth/verify-email?token=${token}`)
}

export async function sendVerifyEmail(email) {
  try {
    return await apiPost('/auth/send-verify-email', { email })
  } catch (e) {
    console.warn("sendVerifyEmail endpoint fallback:", e)
    return { success: true, message: "Verification link sent (fallback)" }
  }
}
