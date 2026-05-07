import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CoinAnimation from '@/components/animations/CoinAnimation'
import { usePreferences } from '@/hooks/usePreferences'
import type { PackItem } from '@/types/pack'

const POOL: PackItem[] = [
  { value: 'HEADS', icon: '👑' },
  { value: 'TAILS', icon: '🦅' },
]

export default function CoinFlip() {
  const [result, setResult] = useState<PackItem | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const { durationFor } = usePreferences()

  const flip = useCallback(() => {
    if (isSpinning) return
    setResult(POOL[Math.floor(Math.random() * POOL.length)]!)
    setSpinId((n) => n + 1)
    setIsSpinning(true)
  }, [isSpinning])

  const handleComplete = useCallback(() => setIsSpinning(false), [])

  const duration = useMemo(() => durationFor('coin'), [durationFor])

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Coin Flip</h2>

      <div className="mt-10">
        <CoinAnimation
          pool={POOL}
          result={result}
          spinId={spinId}
          isSpinning={isSpinning}
          onComplete={handleComplete}
          durationMs={duration}
        />
      </div>

      <button
        type="button"
        onClick={flip}
        disabled={isSpinning}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-yellow to-neon-orange text-ink shadow-[0_0_40px_-8px_rgba(255,240,78,0.7)] hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Flipping…' : result ? 'Flip Again' : 'Flip'}
      </button>
    </section>
  )
}
