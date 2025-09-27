'use client'

import { useState, useCallback } from 'react'

interface AdminState {
  loading: boolean
  error: string | null
  data: any
}

interface UseAdminStateReturn {
  state: AdminState
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setData: (data: any) => void
  reset: () => void
  execute: (asyncFn: () => Promise<any>) => Promise<void>
}

export function useAdminState(initialData: any = null): UseAdminStateReturn {
  const [state, setState] = useState<AdminState>({
    loading: false,
    error: null,
    data: initialData
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data, loading: false, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: initialData
    })
  }, [initialData])

  const execute = useCallback(async (asyncFn: () => Promise<any>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFn()
      setData(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }, [setLoading, setError, setData])

  return {
    state,
    setLoading,
    setError,
    setData,
    reset,
    execute
  }
}
