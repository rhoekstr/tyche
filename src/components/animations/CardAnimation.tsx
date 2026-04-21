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

/** Card flips face-down (90deg), pauses, then flips face-up revealing the result */
export default function CardAnimation({
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1000,
}: Props) {
  const completeFiredRef = useRef(false)
  const [phase, setPhase] = useState<'idle' | 'facedown' | 'faceup'>('idle')

  useEffect(() => {
    if (!isSpinning || !result) return
    completeFiredRef.current = false
    setPhase('facedown')

    const half = durationMs / 2

    const t1 = setTimeout(() => setPhase('faceup'), half)
    const t2 = setTimeout(() => {
      if (completeFiredRef.current) return
      completeFiredRef.current = true
      onComplete()
    }, durationMs + 20)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [spinId, isSpinning, result, durationMs, onComplete])

  // When spin completes from outside (e.g. skip), reset to idle
  useEffect(() => {
    if (!isSpinning && phase === 'facedown') setPhase('idle')
  }, [isSpinning, phase])

  // Show face when in faceup phase OR when resting with a result
  const showFace = (phase === 'faceup' || (!isSpinning && phase !== 'facedown')) && result !== null

  return (
    <div className="flex justify-center" style={{ perspective: '800px' }}>
      <div
        key={spinId}
        className="w-36 h-52 transition-all duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: phase === 'facedown' ? 'rotateY(90deg)' : 'rotateY(0deg)',
          transition: `transform ${durationMs / 2}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {showFace ? (
          <div className="w-full h-full rounded-2xl bg-white flex flex-col items-center justify-center gap-2 shadow-2xl shadow-[0_0_40px_rgba(255,43,214,0.4)]">
            <span className="text-display text-3xl text-gray-900 font-bold">
              {result.value}
            </span>
          </div>
        ) : (
          <div
            className={`w-full h-full rounded-2xl flex items-center justify-center ${
              phase === 'facedown'
                ? 'bg-gradient-to-br from-neon-violet to-neon-cobalt'
                : result
                ? 'bg-gradient-to-br from-neon-violet to-neon-cobalt shadow-[0_0_40px_-8px_rgba(138,43,226,0.7)]'
                : 'bg-ink-veil ring-2 ring-white/20'
            }`}
          >
            {!result && <span className="text-display text-white/40 text-3xl">🂠</span>}
          </div>
        )}
      </div>
    </div>
  )
}
