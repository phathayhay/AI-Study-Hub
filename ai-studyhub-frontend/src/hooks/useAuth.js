import { useState, useEffect } from 'react'
import { logout as apiLogout } from '../features/auth/authService'
import { getUserProfile } from '../services/userService'

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

        // Background-sync user profile with server
        getUserProfile()
          .then(res => {
            if (res?.success && res?.data) {
              const profile = res.data
              const updatedUser = {
                ...u,
                id: profile.id,
                email: profile.email || u.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                fullName: profile.fullName,
                role: profile.role,
                avatarUrl: profile.avatarUrl,
                verificationStatus: profile.verificationStatus,
                campus: profile.campus,
                majorId: profile.majorId,
                majorName: profile.majorName,
                currentSemester: profile.currentSemester,
                status: profile.status,
                planName: profile.planName,
                planExpiresAt: profile.planExpiresAt
              }
              if (profile.avatarUrl) {
                localStorage.setItem(`avatarUrl_${profile.email}`, profile.avatarUrl)
              } else {
                localStorage.removeItem(`avatarUrl_${profile.email}`)
              }
              // Also sync verificationStatus to localStorage for Settings modal
              if (profile.verificationStatus) {
                const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified' }
                localStorage.setItem('verificationStatus', vsMap[profile.verificationStatus] || 'unverified')
              }
              localStorage.setItem('user', JSON.stringify(updatedUser))
              setUser(updatedUser)
            }
          })
          .catch(err => {
            console.error('Failed to sync user profile:', err)
          })
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
      
      // Save avatar to cache if present, otherwise fallback to cache
      if (u.avatarUrl) {
        localStorage.setItem(`avatarUrl_${u.email}`, u.avatarUrl)
      } else {
        const cachedAvatar = localStorage.getItem(`avatarUrl_${u.email}`)
        if (cachedAvatar) {
          u.avatarUrl = cachedAvatar
        }
      }

      if (!u.fullName && (u.firstName || u.lastName)) {
        u.fullName = `${u.lastName || ''} ${u.firstName || ''}`.trim()
      }

      if (u.campus && typeof u.campus !== 'string') {
        u.campus = String(u.campus)
      }

      // Sync verificationStatus from login response to localStorage
      if (u.verificationStatus) {
        const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified' }
        localStorage.setItem('verificationStatus', vsMap[u.verificationStatus] || 'unverified')
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
