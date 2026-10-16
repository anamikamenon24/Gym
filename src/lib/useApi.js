import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

// Loads an API resource with loading / error state and a reload() for retry buttons.
export function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api(path)
      setState({ data, error: null, loading: false })
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }))
    }
  }, [path])

  useEffect(() => {
    if (enabled) load()
  }, [enabled, load])

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), [])

  return { ...state, reload: load, setData }
}
