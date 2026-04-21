import { useCallback, useMemo, useRef, useState } from 'react'
import {
  drawWithReplacement,
  drawWithoutReplacement,
  filterItems,
  initDrawState,
  reconcileDrawState,
  type DrawState,
} from '@/utils/randomize'
import type { FilterValues, Pack, PackItem } from '@/types/pack'
import { resolveSampling } from '@/types/pack'

export type RandomizerWarning =
  | { kind: 'empty-pool' }
  | { kind: 'pool-exhausted'; mode: 'warn' | 'block' }
  | null

export interface RandomizerApi {
  pool: PackItem[]
  result: PackItem | null
  isSpinning: boolean
  spinId: number
  remaining: number
  showRemaining: boolean
  warning: RandomizerWarning
  canSpin: boolean
  spin: () => void
  markSpinComplete: () => void
  reshuffle: () => void
  acknowledgeWarning: () => void
}

export function useRandomizer(
  pack: Pack | null,
  activeFilters: FilterValues | undefined,
): RandomizerApi {
  const sampling = pack ? resolveSampling(pack) : null

  const pool = useMemo(() => {
    if (!pack) return []
    return filterItems(pack.items, pack.filters, activeFilters)
  }, [pack, activeFilters])

  const drawStateRef = useRef<DrawState>({ remaining: [], drawn: [] })
  const lastPackIdRef = useRef<string | null>(null)

  if (pack && lastPackIdRef.current !== pack.id) {
    drawStateRef.current = initDrawState(pool)
    lastPackIdRef.current = pack.id
  }

  const [result, setResult] = useState<PackItem | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinId, setSpinId] = useState(0)
  const [warning, setWarning] = useState<RandomizerWarning>(null)
  const [_poolVersion, setPoolVersion] = useState(0)

  const remainingCount = sampling?.replacement
    ? pool.length
    : drawStateRef.current.remaining.length

  const canSpin = Boolean(
    pack &&
      !isSpinning &&
      pool.length > 0 &&
      !(warning?.kind === 'pool-exhausted' && warning.mode === 'block'),
  )

  const spin = useCallback(() => {
    if (!pack || !sampling || isSpinning) return
    if (pool.length === 0) {
      setWarning({ kind: 'empty-pool' })
      return
    }

    if (sampling.replacement) {
      const item = drawWithReplacement(pool)
      setResult(item)
      setIsSpinning(true)
      setSpinId((s) => s + 1)
      return
    }

    const reconciled = reconcileDrawState(drawStateRef.current, pool)
    const filteredRemaining = reconciled.remaining.filter((i) =>
      pool.some((p) => p.value === i.value),
    )
    const workingState: DrawState = {
      remaining: filteredRemaining,
      drawn: reconciled.drawn.filter((i) => pool.some((p) => p.value === i.value)),
    }

    const drawPool = pool
    const r = drawWithoutReplacement(workingState, drawPool)
    drawStateRef.current = r.state
    setResult(r.item)
    setIsSpinning(true)
    setSpinId((s) => s + 1)

    if (r.poolExhausted) {
      if (sampling.exhaustedBehavior === 'reshuffle') {
        drawStateRef.current = initDrawState(drawPool)
      } else if (sampling.exhaustedBehavior === 'warn') {
        setWarning({ kind: 'pool-exhausted', mode: 'warn' })
        drawStateRef.current = initDrawState(drawPool)
      } else {
        setWarning({ kind: 'pool-exhausted', mode: 'block' })
      }
      setPoolVersion((v) => v + 1)
    }
  }, [pack, sampling, pool, isSpinning])

  const markSpinComplete = useCallback(() => setIsSpinning(false), [])

  const reshuffle = useCallback(() => {
    drawStateRef.current = initDrawState(pool)
    setWarning(null)
    setPoolVersion((v) => v + 1)
  }, [pool])

  const acknowledgeWarning = useCallback(() => setWarning(null), [])

  return {
    pool,
    result,
    isSpinning,
    spinId,
    remaining: remainingCount,
    showRemaining: sampling ? !sampling.replacement : false,
    warning,
    canSpin,
    spin,
    markSpinComplete,
    reshuffle,
    acknowledgeWarning,
  }
}
