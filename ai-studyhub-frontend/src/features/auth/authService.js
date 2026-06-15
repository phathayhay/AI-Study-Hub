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

export async function logout() {
  try { await apiPost('/auth/logout') } catch { /* ignore */ }
}