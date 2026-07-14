import { useCallback, useEffect, useState } from 'react'
import { formatAdminError, unwrapList } from '../utils/adminNormalizers'

export function useAdminResource(loader, options = {}) {
  const { initialData = [], normalize = unwrapList } = options
  const [state, setState] = useState({ data: initialData, error: '', loading: true })

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, error: '', loading: true }))
    try {
      const response = await loader()
      setState({ data: normalize(response), error: '', loading: false })
      return response
    } catch (error) {
      setState((current) => ({ data: current.data, error: formatAdminError(error), loading: false }))
      throw error
    }
  }, [loader, normalize])

  useEffect(() => {
    let active = true
    reload().catch(() => {
      if (!active) return
    })
    return () => {
      active = false
    }
  }, [reload])

  return { data: state.data, items: state.data, error: state.error, loading: state.loading, reload }
}

