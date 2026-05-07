import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RPSAnimation from '@/components/animations/RPSAnimation'
import ResultLabel from '@/components/animations/ResultLabel'
import { usePreferences } from '@/hooks/usePreferences'
import { useSound } from '@/hooks/useSound'
import type { PackItem } from '@/types/pack'

const POOL: PackItem[] = [
  { value: 'Rock', icon: '🪨' },
  { value: 'Paper', icon: '📄' },
  { value: 'Scissors', icon: '✂️' },
]

export default function RPS() {
  const [result, setResult] = useState<PackItem | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const { durationFor } = usePreferences()
  const sound = useSound()

  const pick = useCallback(() => {
    if (isSpinning) return
    sound.playSpin()
    setResult(POOL[Math.floor(Math.random() * POOL.length)]!)
    setSpinId((n) => n + 1)
    setIsSpinning(true)
  }, [isSpinning, sound])

  const handleComplete = useCallback(() => {
    sound.playLand()
    setIsSpinning(false)
  }, [sound])
  const duration = useMemo(() => durationFor('rps'), [durationFor])

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Rock · Paper · Scissors</h2>
      <p className="mt-2 text-sm text-white/60">
        Your throw is randomly assigned. Compare in person.
      </p>

      {/* Idle "panel" preview when no result yet — show all three options. */}
      {!result && !isSpinning ? (
        <div className="mt-8 flex justify-center gap-3">
          {POOL.map((item) => (
            <div
              key={item.value}
              className="flex flex-col items-center justify-center gap-2 w-24 h-32 rounded-2xl bg-ink-veil ring-1 ring-white/15"
            >
              <span className="text-4xl leading-none">{item.icon}</span>
              <span className="text-display text-xs uppercase tracking-widest text-white/60">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <RPSAnimation
            pool={POOL}
            result={result}
            spinId={spinId}
            isSpinning={isSpinning}
            onComplete={handleComplete}
            durationMs={duration}
          />
          <ResultLabel item={result} isSpinning={isSpinning} />
        </div>
      )}

      <button
        type="button"
        onClick={pick}
        disabled={isSpinning}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-acid to-neon-cyan text-ink shadow-[0_0_40px_-8px_rgba(124,255,78,0.7)] hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Throwing…' : result ? 'Pick Again' : 'Pick'}
      </button>
    </section>
  )
}
