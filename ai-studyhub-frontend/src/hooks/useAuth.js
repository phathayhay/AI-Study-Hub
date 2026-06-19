import { useState, useEffect } from 'react'
import { logout as apiLogout } from '../features/auth/authService'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken')
    const savedUser = localStorage.getItem('user')
    if (accessToken && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const saveSession = (res) => {
    if (res?.data) {
      const u = res.data
      localStorage.setItem('accessToken', u.accessToken)
      if (u.refreshToken) {
        localStorage.setItem('refreshToken', u.refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return u
    }
    return null
  }

  const login = async (res) => {
    return saveSession(res)
  }

  const register = async (res) => {
    return saveSession(res)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await apiLogout(refreshToken)
      } catch (err) {
        console.error('Logout API error:', err)
      }
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return { user, loading, login, register, logout, setUser }
}
