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
  const [frontValue, setFrontValue] = useState<string>(result?.value ?? '?')
  const [backValue, setBackValue] = useState<string>('?')

  useEffect(() => {
    if (!isSpinning || !result) {
      setFrontValue(result?.value ?? '?')
      if (coinRef.current) coinRef.current.style.transform = 'rotateY(0deg)'
      return
    }
    completeFiredRef.current = false

    const pickValue = (): string =>
      pool.length > 0
        ? (pool[Math.floor(Math.random() * pool.length)]?.value ?? result.value)
        : result.value

    setFrontValue(pickValue())
    setBackValue(pickValue())

    const start = performance.now()
    let lastPhase = 0

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rot = easeOutCubic(t) * TOTAL_ROTATION
      if (coinRef.current) coinRef.current.style.transform = `rotateY(${rot}deg)`

      const phase = Math.floor(rot / 180)
      if (phase !== lastPhase) {
        lastPhase = phase
        if (phase % 2 === 1) setFrontValue(pickValue())
        else setBackValue(pickValue())
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setFrontValue(result.value)
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
        <CoinFace side="front" value={frontValue} lit={lit} />
        <CoinFace side="back" value={backValue} lit={lit} />
      </div>
    </div>
  )
}

function CoinFace({
  side,
  value,
  lit,
}: {
  side: 'front' | 'back'
  value: string
  lit: boolean
}) {
  const fontSize = value.length > 10 ? '1rem' : value.length > 6 ? '1.25rem' : '1.625rem'
  return (
    <div
      className={`absolute inset-0 rounded-full flex items-center justify-center text-display text-center px-5 leading-tight ${
        lit
          ? 'bg-gradient-to-br from-neon-yellow via-neon-orange to-neon-magenta text-ink shadow-[0_0_60px_-8px_rgba(255,240,78,0.8)]'
          : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
      }`}
      style={{
        transform: side === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        fontSize,
      }}
    >
      <span className="line-clamp-3">{value}</span>
    </div>
  )
}
