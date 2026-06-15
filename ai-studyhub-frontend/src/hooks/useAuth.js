import { useState, useEffect, useCallback } from 'react'
import * as authService from '../features/auth/authService'

function loadUser() {
  try {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveUser(u) {
  if (u) localStorage.setItem('user', JSON.stringify(u))
  else localStorage.removeItem('user')
}

export default function useAuth() {
  const [user, setUser] = useState(loadUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    const cached = loadUser()
    if (cached) { setUser(cached); setLoading(false); return }
    authService.getMe().then((res) => {
      if (res?.data) {
        const d = res.data
        const u = { email: d.email, fullName: d.fullName, studentCode: d.studentCode, role: d.roleName }
        setUser(u)
        saveUser(u)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login({ email, password })
    const d = res.data || res
    if (d.accessToken) localStorage.setItem('accessToken', d.accessToken)
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken)
    const u = { email: d.email, fullName: d.fullName, studentCode: d.studentCode, role: d.role }
    setUser(u)
    saveUser(u)
    return u
  }, [])

  const register = useCallback(async (data) => {
    const res = await authService.register(data)
    const d = res.data || res
    if (d.accessToken) localStorage.setItem('accessToken', d.accessToken)
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken)
    const u = { email: d.email, fullName: d.fullName, studentCode: d.studentCode, role: d.role }
    setUser(u)
    saveUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken')
    await authService.logout(rt)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    saveUser(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken')
    if (!rt) return null
    try {
      const res = await authService.refresh(rt)
      const d = res.data || res
      if (d.accessToken) localStorage.setItem('accessToken', d.accessToken)
      if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken)
      const u = { email: d.email, fullName: d.fullName, studentCode: d.studentCode, role: d.role }
      setUser(u)
      saveUser(u)
      return u
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      saveUser(null)
      setUser(null)
      return null
    }
  }, [])

  const changePassword = useCallback(async (data) => {
    return authService.changePassword(data)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(async (data) => {
    return authService.resetPassword(data)
  }, [])

  return { user, loading, login, register, logout, refresh, changePassword, forgotPassword, resetPassword }
}
