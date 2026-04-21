import { useEffect, useRef } from 'react'
import type { PackItem } from '@/types/pack'

interface Props {
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

export default function CoinAnimation({
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1200,
}: Props) {
  const completeFiredRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSpinning || !result) return
    completeFiredRef.current = false

    const handle = setTimeout(() => {
      if (completeFiredRef.current) return
      completeFiredRef.current = true
      onComplete()
    }, durationMs + 20)

    return () => clearTimeout(handle)
  }, [spinId, isSpinning, result, durationMs, onComplete])

  const label = result?.value ?? '?'

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        key={spinId}
        className="relative w-48 h-48 flex items-center justify-center"
        style={{ perspective: '600px' }}
      >
        <div
          className={`w-full h-full rounded-full flex items-center justify-center text-display text-2xl font-bold
            ${isSpinning ? 'coin-spin' : 'coin-settle'}
            ${result
              ? 'bg-gradient-to-br from-neon-yellow via-neon-orange to-neon-magenta text-ink shadow-[0_0_60px_-8px_rgba(255,240,78,0.8)]'
              : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
            }`}
        >
          {isSpinning ? '' : label}
        </div>
      </div>

      <style>{`
        @keyframes coinSpin {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(1440deg); }
        }
        .coin-spin {
          animation: coinSpin ${durationMs}ms cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
        }
        .coin-settle {
          transform: rotateY(0deg);
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  )
}
