import { useState } from 'react'
import { Link } from 'react-router-dom'

const PRESETS = [4, 6, 8, 10, 12, 20] as const

export default function DiceRoll() {
  const [sides, setSides] = useState<number>(6)
  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [rollKey, setRollKey] = useState(0)

  const activeSides = customInput
    ? Math.max(2, Math.min(1000, parseInt(customInput, 10) || 6))
    : sides

  function roll() {
    setResult(Math.floor(Math.random() * activeSides) + 1)
    setRollKey((k) => k + 1)
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
            onClick={() => { setSides(n); setCustomInput('') }}
            className={`px-4 py-2 rounded-xl text-display text-sm tracking-widest transition ${
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
          onChange={(e) => setCustomInput(e.target.value)}
          className="w-24 px-3 py-2 rounded-xl bg-ink-veil text-white text-sm text-center ring-1 ring-white/20 focus:ring-neon-violet outline-none placeholder:text-white/40"
        />
      </div>

      <div className="mt-10">
        <div
          key={rollKey}
          className={`mx-auto w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
            result !== null
              ? 'bg-gradient-to-br from-neon-violet to-neon-cobalt shadow-[0_0_60px_-8px_rgba(138,43,226,0.9)]'
              : 'bg-ink-veil ring-2 ring-white/20'
          }`}
        >
          <span className="text-display text-4xl text-white">{result ?? '?'}</span>
          <span className="text-xs uppercase tracking-widest text-white/60">d{activeSides}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={roll}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-violet to-neon-cobalt text-white shadow-[0_0_40px_-8px_rgba(138,43,226,0.7)] hover:brightness-110 active:scale-95 transition"
      >
        {result !== null ? 'Roll Again' : 'Roll'}
      </button>
    </section>
  )
}
