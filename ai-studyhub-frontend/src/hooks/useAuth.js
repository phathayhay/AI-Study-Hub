import { useState, useEffect, useCallback } from 'react'
import * as authService from '../features/auth/authService'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    authService.getMe().then((res) => {
      if (res?.data) {
        const d = res.data
        setUser({ email: d.email, fullName: d.fullName, studentCode: d.studentCode, role: d.roleName })
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
    return u
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  return { user, loading, login, logout }
}