import { useCallback, useEffect, useState } from 'react'
import { storageGet, storageSet } from '@/utils/storage'
import type { UserPreferences } from '@/types/config'
import { DEFAULT_PREFERENCES } from '@/types/config'

const STORAGE_KEY = 'preferences'

function loadPreferences(): UserPreferences {
  return storageGet<UserPreferences>(STORAGE_KEY) ?? { ...DEFAULT_PREFERENCES }
}

/** Base durations (ms) per animation mode at 1× speed */
const BASE_DURATIONS: Record<string, number> = {
  slot: 1600,
  coin: 1200,
  dice: 1400,
  card: 1000,
}

const SPEED_MULTIPLIER: Record<UserPreferences['animationSpeed'], number> = {
  slow: 2.0,
  normal: 1.0,
  fast: 0.5,
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences)

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'so-random:preferences') {
        setPrefs(loadPreferences())
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      storageSet(STORAGE_KEY, next)
      return next
    })
  }, [])

  /** Duration in ms for the given animation mode, adjusted by speed preference */
  const durationFor = useCallback(
    (mode: string): number => {
      const base = BASE_DURATIONS[mode] ?? 1400
      const mult = SPEED_MULTIPLIER[prefs.animationSpeed]
      return Math.round(base * mult)
    },
    [prefs.animationSpeed],
  )

  return { prefs, updatePreferences, durationFor }
}
