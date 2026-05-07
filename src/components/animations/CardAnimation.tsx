import { useEffect, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'

interface Props {
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

const TOTAL_ROTATION = 1440
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const RED_SUITS = new Set(['♥', '♦', '❤️', '♦️', '♥️'])

export default function CardAnimation({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1000,
}: Props) {
  const completeFiredRef = useRef(false)
  const rafRef = useRef<number>(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const [frontItem, setFrontItem] = useState<PackItem | null>(result)

  useEffect(() => {
    if (!isSpinning || !result) {
      setFrontItem(result)
      if (cardRef.current) cardRef.current.style.transform = 'rotateY(0deg)'
      return
    }
    completeFiredRef.current = false

    const pickItem = (): PackItem =>
      pool.length > 0 ? (pool[Math.floor(Math.random() * pool.length)] ?? result) : result

    setFrontItem(pickItem())

    const start = performance.now()
    let lastPhase = 0
    const numPhases = TOTAL_ROTATION / 180

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rot = easeOutCubic(t) * TOTAL_ROTATION
      if (cardRef.current) cardRef.current.style.transform = `rotateY(${rot}deg)`

      // Update front face's content while it's hidden. The last update
      // before completion locks in `result`, so when the front rotates
      // back into view at t=1 it's already showing the final value.
      const phase = Math.floor(rot / 180)
      if (phase !== lastPhase) {
        lastPhase = phase
        if (phase % 2 === 1) {
          setFrontItem(phase === numPhases - 1 ? result : pickItem())
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setFrontItem(result)
        if (cardRef.current) cardRef.current.style.transform = `rotateY(${TOTAL_ROTATION}deg)`
        if (!completeFiredRef.current) {
          completeFiredRef.current = true
          onComplete()
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinId, isSpinning, result, pool, durationMs, onComplete])

  const lit = result !== null

  return (
    <div className="flex justify-center" style={{ perspective: '900px' }}>
      <div
        ref={cardRef}
        className="relative w-36 h-52 will-change-transform"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateY(0deg)' }}
      >
        <CardFront item={frontItem} lit={lit} />
        <CardBack />
      </div>
    </div>
  )
}

function CardFront({ item, lit }: { item: PackItem | null; lit: boolean }) {
  const icon = item?.icon
  const valueText = item?.shortLabel ?? item?.value ?? '?'
  const isRed = icon ? RED_SUITS.has(icon) : false
  const cornerText = valueText.length <= 3 ? valueText : ''

  return (
    <div
      className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center px-3 text-display ${
        lit
          ? 'bg-white text-gray-900 shadow-[0_0_50px_-10px_rgba(255,43,214,0.55)]'
          : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
      }`}
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      {cornerText && (
        <span className={`absolute top-2 left-3 text-sm ${isRed ? 'text-red-600' : ''}`}>
          {cornerText}
        </span>
      )}
      {icon ? (
        <>
          <span className={`text-6xl leading-none ${isRed ? 'text-red-600' : ''}`}>{icon}</span>
          {valueText && cornerText !== valueText && (
            <span className={`mt-2 text-xl ${isRed ? 'text-red-600' : ''}`}>{valueText}</span>
          )}
        </>
      ) : (
        <span
          className="text-center leading-tight"
          style={{ fontSize: valueText.length > 12 ? '1rem' : valueText.length > 6 ? '1.25rem' : '1.75rem' }}
        >
          {valueText}
        </span>
      )}
      {cornerText && (
        <span className={`absolute bottom-2 right-3 text-sm rotate-180 ${isRed ? 'text-red-600' : ''}`}>
          {cornerText}
        </span>
      )}
    </div>
  )
}

function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-2xl flex items-center justify-center bg-gradient-to-br from-neon-violet via-neon-magenta to-neon-cobalt shadow-2xl"
      style={{
        transform: 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="absolute inset-2 rounded-xl ring-2 ring-white/30" />
      <span className="text-display text-white/80 text-3xl">✦</span>
    </div>
  )
}
