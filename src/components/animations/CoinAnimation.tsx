import { useEffect, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'
import { faceLabel } from '@/utils/faceText'

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

export default function CoinAnimation({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1200,
}: Props) {
  const completeFiredRef = useRef(false)
  const rafRef = useRef<number>(0)
  const coinRef = useRef<HTMLDivElement>(null)
  const [frontItem, setFrontItem] = useState<PackItem | null>(result)
  const [backItem, setBackItem] = useState<PackItem | null>(null)

  useEffect(() => {
    if (!isSpinning || !result) {
      setFrontItem(result)
      if (coinRef.current) coinRef.current.style.transform = 'rotateY(0deg)'
      return
    }
    completeFiredRef.current = false

    const pickItem = (): PackItem =>
      pool.length > 0 ? (pool[Math.floor(Math.random() * pool.length)] ?? result) : result

    setFrontItem(pickItem())
    setBackItem(pickItem())

    const start = performance.now()
    let lastPhase = 0

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rot = easeOutCubic(t) * TOTAL_ROTATION
      if (coinRef.current) coinRef.current.style.transform = `rotateY(${rot}deg)`

      const phase = Math.floor(rot / 180)
      if (phase !== lastPhase) {
        lastPhase = phase
        if (phase % 2 === 1) setFrontItem(pickItem())
        else setBackItem(pickItem())
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setFrontItem(result)
        if (coinRef.current) coinRef.current.style.transform = `rotateY(${TOTAL_ROTATION}deg)`
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
    <div className="flex justify-center" style={{ perspective: '800px' }}>
      <div
        ref={coinRef}
        className="relative w-48 h-48 will-change-transform"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateY(0deg)' }}
      >
        <CoinFace side="front" item={frontItem} lit={lit} />
        <CoinFace side="back" item={backItem} lit={lit} />
      </div>
    </div>
  )
}

function CoinFace({
  side,
  item,
  lit,
}: {
  side: 'front' | 'back'
  item: PackItem | null
  lit: boolean
}) {
  const { text, fontSize } = faceLabel(item, { maxChars: 8, sizes: ['1.625rem', '1.25rem', '1rem'] })
  const icon = item?.icon
  return (
    <div
      className={`absolute inset-0 rounded-full flex flex-col items-center justify-center text-display text-center px-5 leading-tight gap-1 ${
        lit
          ? 'bg-gradient-to-br from-neon-yellow via-neon-orange to-neon-magenta text-ink shadow-[0_0_60px_-8px_rgba(255,240,78,0.8)]'
          : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
      }`}
      style={{
        transform: side === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {icon && <span className="text-4xl leading-none">{icon}</span>}
      {text && (
        <span style={{ fontSize }} className="line-clamp-2">
          {text}
        </span>
      )}
    </div>
  )
}
