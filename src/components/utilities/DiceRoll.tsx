import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DiceAnimation from '@/components/animations/DiceAnimation'
import { usePreferences } from '@/hooks/usePreferences'
import type { PackItem } from '@/types/pack'

const PRESETS = [4, 6, 8, 10, 12, 20] as const

export default function DiceRoll() {
  const [sides, setSides] = useState<number>(6)
  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState<PackItem | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const { durationFor } = usePreferences()

  const activeSides = customInput
    ? Math.max(2, Math.min(1000, parseInt(customInput, 10) || 6))
    : sides

  const pool = useMemo<PackItem[]>(
    () => Array.from({ length: activeSides }, (_, i) => ({ value: String(i + 1) })),
    [activeSides],
  )

  const roll = useCallback(() => {
    if (isSpinning) return
    setResult({ value: String(Math.floor(Math.random() * activeSides) + 1) })
    setSpinId((n) => n + 1)
    setIsSpinning(true)
  }, [isSpinning, activeSides])

  const handleComplete = useCallback(() => setIsSpinning(false), [])

  const duration = useMemo(() => durationFor('dice'), [durationFor])

  function setPreset(n: number) {
    if (isSpinning) return
    setSides(n)
    setCustomInput('')
    setResult(null)
  }

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Dice Roll</h2>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPreset(n)}
            disabled={isSpinning}
            className={`px-4 py-2 rounded-xl text-display text-sm tracking-widest transition disabled:opacity-50 ${
              activeSides === n && !customInput
                ? 'bg-neon-violet text-white shadow-[0_0_20px_-4px_rgba(138,43,226,0.9)]'
                : 'bg-ink-veil text-white/70 hover:text-white hover:bg-ink-soft'
            }`}
          >
            d{n}
          </button>
        ))}
        <input
          type="number"
          min={2}
          max={1000}
          placeholder="Custom"
          value={customInput}
          onChange={(e) => { setCustomInput(e.target.value); setResult(null) }}
          disabled={isSpinning}
          className="w-24 px-3 py-2 rounded-xl bg-ink-veil text-white text-sm text-center ring-1 ring-white/20 focus:ring-neon-violet outline-none placeholder:text-white/40 disabled:opacity-50"
        />
      </div>

      <div className="mt-8">
        <DiceAnimation
          pool={pool}
          result={result}
          spinId={spinId}
          isSpinning={isSpinning}
          onComplete={handleComplete}
          durationMs={duration}
        />
      </div>

      <p className="mt-2 text-xs uppercase tracking-widest text-white/50">d{activeSides}</p>

      <button
        type="button"
        onClick={roll}
        disabled={isSpinning}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-violet to-neon-cobalt text-white shadow-[0_0_40px_-8px_rgba(138,43,226,0.7)] hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Rolling…' : result ? 'Roll Again' : 'Roll'}
      </button>
    </section>
  )
}
