'use client'

import { useState, useCallback, useMemo } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface DateRange {
  from: Date
  to: Date
}

interface AdminFilters {
  search: string
  status: string
  dateRange: DateRange
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

interface UseAdminFiltersReturn {
  filters: AdminFilters
  setSearch: (search: string) => void
  setStatus: (status: string) => void
  setDateRange: (dateRange: DateRange) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  resetFilters: () => void
  getQueryParams: () => URLSearchParams
  hasActiveFilters: boolean
}

const defaultFilters: AdminFilters = {
  search: '',
  status: 'all',
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  },
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  limit: 10
}

export function useAdminFilters(initialFilters?: Partial<AdminFilters>): UseAdminFiltersReturn {
  const [filters, setFilters] = useState<AdminFilters>({
    ...defaultFilters,
    ...initialFilters
  })

  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }, [])

  const setStatus = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }, [])

  const setDateRange = useCallback((dateRange: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange, page: 1 }))
  }, [])

  const setSortBy = useCallback((sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }))
  }, [])

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortOrder, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.dateRange.from) params.set('from', filters.dateRange.from.toISOString())
    if (filters.dateRange.to) params.set('to', filters.dateRange.to.toISOString())
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    if (filters.page > 1) params.set('page', filters.page.toString())
    if (filters.limit !== 10) params.set('limit', filters.limit.toString())
    
    return params
  }, [filters])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.sortBy !== 'created_at' ||
      filters.sortOrder !== 'desc' ||
      filters.page > 1 ||
      filters.limit !== 10
    )
  }, [filters])

  return {
    filters,
    setSearch,
    setStatus,
    setDateRange,
    setSortBy,
    setSortOrder,
    setPage,
    setLimit,
    resetFilters,
    getQueryParams,
    hasActiveFilters
  }
}
