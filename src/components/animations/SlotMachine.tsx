import { useEffect, useMemo, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'
import ParticleBurst from './ParticleBurst'

interface Props {
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

const ITEM_HEIGHT = 96
const PADDING_ITEMS = 24

export default function SlotMachine({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1600,
}: Props) {
  const [strip, setStrip] = useState<PackItem[]>([])
  const [burstTrigger, setBurstTrigger] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const reelRef = useRef<HTMLDivElement>(null)
  const completeFiredRef = useRef(false)

  const displayPool = useMemo(
    () => (pool.length > 0 ? pool : result ? [result] : []),
    [pool, result],
  )

  useEffect(() => {
    if (!isSpinning || !result || displayPool.length === 0) return
    completeFiredRef.current = false
    setShowResult(false)

    const filler: PackItem[] = []
    for (let i = 0; i < PADDING_ITEMS; i++) {
      filler.push(displayPool[Math.floor(Math.random() * displayPool.length)]!)
    }
    const newStrip = [...filler, result]
    setStrip(newStrip)

    const reel = reelRef.current
    if (!reel) return

    reel.style.transition = 'none'
    reel.style.transform = 'translate3d(0, 0, 0)'
    void reel.offsetHeight

    const target = -(newStrip.length - 1) * ITEM_HEIGHT
    reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.18, 0.74, 0.14, 1)`
    reel.style.transform = `translate3d(0, ${target}px, 0)`

    const handle = setTimeout(() => {
      if (completeFiredRef.current) return
      completeFiredRef.current = true
      setBurstTrigger((n) => n + 1)
      setShowResult(true)
      onComplete()
    }, durationMs + 20)

    return () => clearTimeout(handle)
  }, [spinId, isSpinning, result, displayPool, durationMs, onComplete])

  const restingItem = !isSpinning && result ? result : null

  return (
    <div className="relative mx-auto w-full max-w-md" aria-live="polite">
      {/* Particle canvas — sits above the reel */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
        <ParticleBurst trigger={burstTrigger} />
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10 transition-shadow ${
          isSpinning ? 'reel-spinning' : 'shadow-[0_0_60px_-12px_rgba(255,43,214,0.55)]'
        }`}
        style={{ height: ITEM_HEIGHT }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/80 to-transparent z-10" />

        {restingItem ? (
          <ReelCell item={restingItem} highlighted revealed={showResult} />
        ) : (
          <div ref={reelRef} className="will-change-transform">
            {strip.map((item, idx) => (
              <ReelCell
                key={`${spinId}-${idx}`}
                item={item}
                highlighted={idx === strip.length - 1}
                revealed={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReelCell({
  item,
  highlighted,
  revealed,
}: {
  item: PackItem
  highlighted: boolean
  revealed: boolean
}) {
  return (
    <div
      className={`flex items-center justify-center text-center px-4 text-display text-2xl md:text-3xl ${
        highlighted
          ? `text-white drop-shadow-[0_0_14px_rgba(255,79,163,1)] ${revealed ? 'result-reveal' : ''}`
          : 'text-white/70'
      }`}
      style={{ height: ITEM_HEIGHT }}
    >
      {item.value}
    </div>
  )
}
