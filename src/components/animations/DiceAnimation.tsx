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

export default function DiceAnimation({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1400,
}: Props) {
  const completeFiredRef = useRef(false)
  const [displayValue, setDisplayValue] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isSpinning || !result || pool.length === 0) return
    completeFiredRef.current = false

    // Rapidly cycle through pool items
    intervalRef.current = setInterval(() => {
      const r = pool[Math.floor(Math.random() * pool.length)]
      setDisplayValue(r?.value ?? null)
    }, 80)

    const handle = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDisplayValue(result.value)
      if (completeFiredRef.current) return
      completeFiredRef.current = true
      onComplete()
    }, durationMs)

    return () => {
      clearTimeout(handle)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [spinId, isSpinning, result, pool, durationMs, onComplete])

  const resting = !isSpinning ? result?.value : null
  const shown = resting ?? displayValue

  return (
    <div className="flex justify-center">
      <div
        key={spinId}
        className={`w-44 h-44 rounded-3xl flex items-center justify-center text-display transition-all
          ${shown && !isSpinning
            ? 'bg-gradient-to-br from-neon-violet to-neon-cobalt shadow-[0_0_60px_-8px_rgba(138,43,226,0.9)] text-3xl text-white'
            : isSpinning
            ? 'bg-gradient-to-br from-neon-violet/60 to-neon-cobalt/60 text-2xl text-white/80 animate-dice-shake'
            : 'bg-ink-veil ring-2 ring-white/20 text-white/40 text-3xl'
          }`}
      >
        {shown ?? '?'}
      </div>

      <style>{`
        @keyframes diceShake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          15%  { transform: rotate(-8deg) scale(1.05); }
          30%  { transform: rotate(6deg) scale(0.97); }
          45%  { transform: rotate(-5deg) scale(1.04); }
          60%  { transform: rotate(4deg) scale(0.98); }
          75%  { transform: rotate(-3deg) scale(1.02); }
        }
        .animate-dice-shake {
          animation: diceShake 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
