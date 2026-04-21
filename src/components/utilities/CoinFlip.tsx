import { useState } from 'react'
import { Link } from 'react-router-dom'

type Face = 'HEADS' | 'TAILS' | null

export default function CoinFlip() {
  const [result, setResult] = useState<Face>(null)
  const [flipKey, setFlipKey] = useState(0)

  function flip() {
    setResult(Math.random() < 0.5 ? 'HEADS' : 'TAILS')
    setFlipKey((k) => k + 1)
  }

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Coin Flip</h2>

      <div className="mt-10 flex items-center justify-center">
        <div
          key={flipKey}
          className={`w-36 h-36 rounded-full flex items-center justify-center text-display text-lg tracking-widest transition-all duration-300 ${
            result
              ? 'bg-gradient-to-br from-neon-yellow via-neon-orange to-neon-magenta text-ink shadow-[0_0_60px_-8px_rgba(255,122,26,0.9)] animate-coin-appear'
              : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
          }`}
        >
          {result ?? '?'}
        </div>
      </div>

      <button
        type="button"
        onClick={flip}
        className="mt-10 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-yellow to-neon-orange text-ink shadow-[0_0_40px_-8px_rgba(255,240,78,0.7)] hover:brightness-110 active:scale-95 transition"
      >
        {result ? 'Flip Again' : 'Flip'}
      </button>
    </section>
  )
}
