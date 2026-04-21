import { useCallback, useEffect, useRef, useState } from 'react'
import {
  drawWithReplacement,
  drawWithoutReplacement,
  filterItems,
  initDrawState,
  reconcileDrawState,
  type DrawState,
} from '@/utils/randomize'
import { resolveSampling, type FilterValues, type Pack, type PackItem } from '@/types/pack'

export interface SlotState {
  /** client-only id */
  id: string
  packId: string | null
  pack: Pack | null
  activeFilters: FilterValues
  result: PackItem | null
  isSpinning: boolean
  spinId: number
}

export type SlotUpdate = Partial<Pick<SlotState, 'packId' | 'pack' | 'activeFilters'>>

const MIN_STOP_MS = 1000
const STAGGER_MS = 350

export function useMultiRandomizer(initialCount = 2) {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    Array.from({ length: initialCount }, (_, i) => makeSlot(i)),
  )
  const drawStates = useRef<Map<string, DrawState>>(new Map())
  const [isAnySpinning, setIsAnySpinning] = useState(false)
  const stopTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const canSpin = !isAnySpinning && slots.some((s) => s.packId !== null)

  const spin = useCallback(() => {
    if (isAnySpinning) return

    // Compute results synchronously before animation starts
    const results: (PackItem | null)[] = slots.map((slot) => {
      if (!slot.pack) return null
      const sampling = resolveSampling(slot.pack)
      const pool = filterItems(slot.pack.items, slot.pack.filters, slot.activeFilters)
      if (pool.length === 0) return null

      if (sampling.replacement) {
        return drawWithReplacement(pool)
      }
      const stateKey = slot.id
      const existing = drawStates.current.get(stateKey) ?? initDrawState(pool)
      const reconciled = reconcileDrawState(existing, pool)
      const r = drawWithoutReplacement(reconciled, pool)
      drawStates.current.set(stateKey, r.state)
      return r.item
    })

    // Mark all slots as spinning with new spinId
    setSlots((prev) =>
      prev.map((s, i) => ({
        ...s,
        result: results[i] ?? s.result,
        isSpinning: results[i] !== null,
        spinId: s.spinId + 1,
      })),
    )
    setIsAnySpinning(true)

    // Clear previous timers
    stopTimers.current.forEach(clearTimeout)
    stopTimers.current = []

    // Stagger each slot's stop
    const activeSlotsIndices = slots
      .map((s, i) => (s.packId !== null && results[i] !== null ? i : -1))
      .filter((i) => i !== -1)

    activeSlotsIndices.forEach((slotIdx, order) => {
      const delay = MIN_STOP_MS + order * STAGGER_MS + Math.random() * 150
      const timer = setTimeout(() => {
        setSlots((prev) =>
          prev.map((s, i) => (i === slotIdx ? { ...s, isSpinning: false } : s)),
        )
        // Check if all done
        if (order === activeSlotsIndices.length - 1) {
          setIsAnySpinning(false)
        }
      }, delay)
      stopTimers.current.push(timer)
    })
  }, [slots, isAnySpinning])

  const addSlot = useCallback(() => {
    setSlots((prev) => [...prev, makeSlot(prev.length)])
  }, [])

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id))
    drawStates.current.delete(id)
  }, [])

  const updateSlot = useCallback((id: string, update: SlotUpdate) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...update }
        // Reset draw state when pack changes
        if (update.packId && update.packId !== s.packId) {
          drawStates.current.delete(id)
          next.result = null
        }
        return next
      }),
    )
  }, [])

  const reorderSlots = useCallback((fromIdx: number, toIdx: number) => {
    setSlots((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved!)
      return next
    })
  }, [])

  // Cleanup on unmount
  useEffect(
    () => () => stopTimers.current.forEach(clearTimeout),
    [],
  )

  return { slots, isAnySpinning, canSpin, spin, addSlot, removeSlot, updateSlot, reorderSlots }
}

function makeSlot(index: number): SlotState {
  return {
    id: `slot-${Date.now()}-${index}`,
    packId: null,
    pack: null,
    activeFilters: {},
    result: null,
    isSpinning: false,
    spinId: 0,
  }
}
