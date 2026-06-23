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
      try {
        const u = JSON.parse(savedUser)
        const cachedAvatar = localStorage.getItem(`avatarUrl_${u.email}`)
        if (cachedAvatar) {
          u.avatarUrl = cachedAvatar
        }
        if (!u.fullName && (u.firstName || u.lastName)) {
          u.fullName = `${u.lastName || ''} ${u.firstName || ''}`.trim()
        }
        setUser(u)
      } catch (e) {
        console.error('Error parsing cached user:', e)
      }
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
      
      // Merge cached avatar if it exists
      const cachedAvatar = localStorage.getItem(`avatarUrl_${u.email}`)
      if (cachedAvatar) {
        u.avatarUrl = cachedAvatar
      }

      if (!u.fullName && (u.firstName || u.lastName)) {
        u.fullName = `${u.lastName || ''} ${u.firstName || ''}`.trim()
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

  const updateAndSetUser = (newUser) => {
    if (typeof newUser === 'function') {
      setUser((prev) => {
        const next = newUser(prev)
        if (next) {
          if (!next.fullName && (next.firstName || next.lastName)) {
            next.fullName = `${next.lastName || ''} ${next.firstName || ''}`.trim()
          }
          if (next.avatarUrl) {
            localStorage.setItem(`avatarUrl_${next.email}`, next.avatarUrl)
          }
          localStorage.setItem('user', JSON.stringify(next))
        } else {
          localStorage.removeItem('user')
        }
        return next
      })
    } else {
      let u = newUser
      if (u) {
        if (!u.fullName && (u.firstName || u.lastName)) {
          u.fullName = `${u.lastName || ''} ${u.firstName || ''}`.trim()
        }
        if (u.avatarUrl) {
          localStorage.setItem(`avatarUrl_${u.email}`, u.avatarUrl)
        }
        localStorage.setItem('user', JSON.stringify(u))
      } else {
        localStorage.removeItem('user')
      }
      setUser(u)
    }
  }

  return { user, loading, login, register, logout, setUser: updateAndSetUser }
}
