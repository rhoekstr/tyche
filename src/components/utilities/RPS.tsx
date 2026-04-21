import { useState } from 'react'
import { Link } from 'react-router-dom'

const THROWS = [
  { name: 'Rock', emoji: '🪨' },
  { name: 'Paper', emoji: '📄' },
  { name: 'Scissors', emoji: '✂️' },
] as const

type Throw = typeof THROWS[number]

export default function RPS() {
  const [result, setResult] = useState<Throw | null>(null)
  const [key, setKey] = useState(0)

  function pick() {
    setResult(THROWS[Math.floor(Math.random() * THROWS.length)]!)
    setKey((k) => k + 1)
  }

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Rock · Paper · Scissors</h2>
      <p className="mt-2 text-sm text-white/60">
        Your throw is randomly assigned. Compare in person.
      </p>

      <div className="mt-10 flex items-center justify-center">
        <div
          key={key}
          className={`w-40 h-40 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all ${
            result
              ? 'bg-gradient-to-br from-neon-acid/30 to-neon-cyan/20 ring-1 ring-neon-acid shadow-[0_0_60px_-8px_rgba(124,255,78,0.7)]'
              : 'bg-ink-veil ring-2 ring-white/20'
          }`}
        >
          <span className="text-6xl">{result?.emoji ?? '🎲'}</span>
          {result && (
            <span className="text-display text-sm uppercase tracking-widest text-neon-acid">
              {result.name}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={pick}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-acid to-neon-cyan text-ink shadow-[0_0_40px_-8px_rgba(124,255,78,0.7)] hover:brightness-110 active:scale-95 transition"
      >
        {result ? 'Pick Again' : 'Pick'}
      </button>
    </section>
  )
}
