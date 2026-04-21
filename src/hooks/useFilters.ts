import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultActiveFilters } from '@/utils/randomize'
import type { FilterValues, Pack } from '@/types/pack'

/** Session-only cache: packId → last-used FilterValues */
const sessionCache = new Map<string, FilterValues>()

export interface FiltersApi {
  activeFilters: FilterValues
  setFilter: (dimension: string, values: string[]) => void
  toggleValue: (dimension: string, value: string) => void
  selectAll: (dimension: string) => void
  clearAll: (dimension: string) => void
  resetToDefault: () => void
  activeCount: number
  totalPossible: number
}

export function useFilters(pack: Pack | null): FiltersApi {
  const defaultRef = useRef<FilterValues>({})

  const [activeFilters, setActiveFilters] = useState<FilterValues>(() => {
    if (!pack) return {}
    const cached = sessionCache.get(pack.id)
    if (cached) return cached
    const def = defaultActiveFilters(pack)
    defaultRef.current = def
    return def
  })

  useEffect(() => {
    if (!pack) return
    const cached = sessionCache.get(pack.id)
    if (cached) {
      setActiveFilters(cached)
    } else {
      const def = defaultActiveFilters(pack)
      defaultRef.current = def
      setActiveFilters(def)
    }
  }, [pack])

  // Persist to session cache whenever filters change
  useEffect(() => {
    if (pack) sessionCache.set(pack.id, activeFilters)
  }, [pack, activeFilters])

  const setFilter = useCallback((dimension: string, values: string[]) => {
    setActiveFilters((prev) => ({ ...prev, [dimension]: values }))
  }, [])

  const toggleValue = useCallback((dimension: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[dimension] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [dimension]: next }
    })
  }, [])

  const selectAll = useCallback(
    (dimension: string) => {
      if (!pack?.filters?.[dimension]) return
      const allValues = new Set<string>()
      for (const item of pack.items) {
        for (const v of item.filters?.[dimension] ?? []) allValues.add(v)
      }
      setActiveFilters((prev) => ({ ...prev, [dimension]: [...allValues] }))
    },
    [pack],
  )

  const clearAll = useCallback((dimension: string) => {
    setActiveFilters((prev) => ({ ...prev, [dimension]: [] }))
  }, [])

  const resetToDefault = useCallback(() => {
    if (!pack) return
    const def = defaultActiveFilters(pack)
    defaultRef.current = def
    setActiveFilters(def)
  }, [pack])

  // Count active filters (dimensions with fewer than all values selected)
  const { activeCount, totalPossible } = (() => {
    if (!pack?.filters) return { activeCount: 0, totalPossible: 0 }
    let active = 0
    let total = 0
    for (const dim of Object.keys(pack.filters)) {
      const allValues = new Set<string>()
      for (const item of pack.items) {
        for (const v of item.filters?.[dim] ?? []) allValues.add(v)
      }
      total += allValues.size
      active += (activeFilters[dim]?.length ?? 0)
    }
    return { activeCount: active, totalPossible: total }
  })()

  return {
    activeFilters,
    setFilter,
    toggleValue,
    selectAll,
    clearAll,
    resetToDefault,
    activeCount,
    totalPossible,
  }
}
