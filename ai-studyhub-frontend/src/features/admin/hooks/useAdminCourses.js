import { useCallback } from 'react'
import { adminCourseApi } from '../api/adminCourseApi'
import { useAdminResource } from './useAdminResource'

export function useAdminCourses() {
  const resource = useAdminResource(useCallback(() => adminCourseApi.list(), []))
  const { reload } = resource
  const create = useCallback(async (body) => {
    const result = await adminCourseApi.create(body)
    await reload()
    return result
  }, [reload])
  const update = useCallback(async (id, body) => {
    const result = await adminCourseApi.update(id, body)
    await reload()
    return result
  }, [reload])
  const remove = useCallback(async (id) => {
    const result = await adminCourseApi.remove(id)
    await reload()
    return result
  }, [reload])
  return { ...resource, create, update, remove }
}
