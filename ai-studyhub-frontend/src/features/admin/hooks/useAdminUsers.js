import { useCallback } from 'react'
import { adminUserApi } from '../api/adminUserApi'
import { useAdminResource } from './useAdminResource'

export function useAdminUsers() {
  const resource = useAdminResource(useCallback(() => adminUserApi.list(), []))
  const { reload } = resource
  const ban = useCallback(async (id) => {
    await adminUserApi.ban(id)
    await reload()
  }, [reload])
  const unban = useCallback(async (id) => {
    await adminUserApi.unban(id)
    await reload()
  }, [reload])
  return { ...resource, ban, unban }
}
