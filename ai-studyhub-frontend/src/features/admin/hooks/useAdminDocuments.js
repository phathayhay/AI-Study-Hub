import { useCallback } from 'react'
import { adminDocumentApi } from '../api/adminDocumentApi'
import { useAdminResource } from './useAdminResource'

export function useAdminDocuments() {
  const resource = useAdminResource(useCallback(() => adminDocumentApi.list(), []))
  const { reload } = resource
  const moderate = useCallback(async (id, status) => {
    await adminDocumentApi.moderate(id, status)
    await reload()
  }, [reload])
  return { ...resource, moderate }
}
