import { useState, useEffect } from 'react'
import { logout as apiLogout } from '../features/auth/authService'
import { getUserProfile } from '../services/userService'
import { clearAuthSession, getRefreshToken, getStoredUser, getToken, persistAuthSession } from '../services/api'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const buildSyncedUser = (baseUser, profile) => ({
    ...baseUser,
    id: profile.id,
    email: profile.email || baseUser?.email,
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
    planExpiresAt: profile.planExpiresAt,
    planStorageLimitMb: profile.planStorageLimitMb,
    planStorageLimitBytes: profile.planStorageLimitBytes,
    planStorageUsedBytes: profile.planStorageUsedBytes,
    planStorageUsedMb: profile.planStorageUsedMb,
    planAiRequestsPerDay: profile.planAiRequestsPerDay,
    planAiRequestsUsedToday: profile.planAiRequestsUsedToday,
    planCanUseAiSummary: profile.planCanUseAiSummary,
    planCanUseFlashcards: profile.planCanUseFlashcards,
    planCanUseQuizzes: profile.planCanUseQuizzes,
    planCanPublishDocuments: profile.planCanPublishDocuments,
    planCanPublishFolders: profile.planCanPublishFolders,
    storageStatus: profile.storageStatus,
    overQuota: profile.overQuota,
    canUpload: profile.canUpload,
    storageMessage: profile.storageMessage,
    verificationRequestSubmitted: profile.verificationRequestSubmitted,
    verificationReviewNote: profile.verificationReviewNote,
  })

  useEffect(() => {
    // Check if user is logged in
    const accessToken = getToken()
    const savedUser = getStoredUser()
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
              const updatedUser = buildSyncedUser(u, profile)
              if (profile.avatarUrl) {
                localStorage.setItem(`avatarUrl_${profile.email}`, profile.avatarUrl)
              } else {
                localStorage.removeItem(`avatarUrl_${profile.email}`)
              }
              // Also sync verificationStatus to localStorage for Settings modal
              if (profile.verificationStatus) {
                const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
                localStorage.setItem('verificationStatus', vsMap[profile.verificationStatus] || 'unverified')
              }
              const remember = localStorage.getItem('authPersistence') !== 'session'
              persistAuthSession(updatedUser, remember)
              setUser(updatedUser)
            }
          })
          .catch(err => {
            console.error('Failed to sync user profile:', err)
            if (err?.status === 401) {
              clearAuthSession()
              setUser(null)
            }
          })
      } catch (e) {
        console.error('Error parsing cached user:', e)
      }
    }
    setLoading(false)
  }, [])

  const saveSession = async (res, remember = true) => {
    if (res?.data) {
      const u = res.data
      
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
        const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
        localStorage.setItem('verificationStatus', vsMap[u.verificationStatus] || 'unverified')
      }

      persistAuthSession(u, remember)
      setUser(u)

      try {
        const profileRes = await getUserProfile()
        const profile = profileRes?.data || profileRes
        if (profile) {
          const updatedUser = buildSyncedUser(u, profile)
          if (profile.avatarUrl) {
            localStorage.setItem(`avatarUrl_${profile.email}`, profile.avatarUrl)
          } else if (profile.email) {
            localStorage.removeItem(`avatarUrl_${profile.email}`)
          }
          if (profile.verificationStatus) {
            const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
            localStorage.setItem('verificationStatus', vsMap[profile.verificationStatus] || 'unverified')
          }
          persistAuthSession(updatedUser, remember)
          setUser(updatedUser)
          return updatedUser
        }
      } catch (err) {
        console.error('Failed to fetch full profile after login:', err)
      }

      return u
    }
    return null
  }

  const login = async (res, remember = true) => {
    return await saveSession(res, remember)
  }

  const register = async (res) => {
    return await saveSession(res)
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await apiLogout(refreshToken)
      } catch (err) {
        console.error('Logout API error:', err)
      }
    }
    clearAuthSession()
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
          const remember = localStorage.getItem('authPersistence') !== 'session'
          persistAuthSession(next, remember)
        } else {
          clearAuthSession()
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
        const remember = localStorage.getItem('authPersistence') !== 'session'
        persistAuthSession(u, remember)
      } else {
        clearAuthSession()
      }
      setUser(u)
    }
  }

  return { user, loading, login, register, logout, setUser: updateAndSetUser }
}
