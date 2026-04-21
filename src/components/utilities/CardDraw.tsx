import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { drawWithoutReplacement, initDrawState, type DrawState } from '@/utils/randomize'
import type { PackItem } from '@/types/pack'

const SUITS = ['♠', '♥', '♦', '♣'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
const RED_SUITS = new Set(['♥', '♦'])

const DECK: PackItem[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ value: `${rank}${suit}` })),
)

function buildDeck(): DrawState {
  return initDrawState(DECK)
}

export default function CardDraw() {
  const stateRef = useRef<DrawState>(buildDeck())
  const [result, setResult] = useState<PackItem | null>(null)
  const [drawKey, setDrawKey] = useState(0)
  const [exhaustedWarning, setExhaustedWarning] = useState(false)
  const [remaining, setRemaining] = useState(DECK.length)

  const draw = useCallback(() => {
    if (exhaustedWarning) return
    const r = drawWithoutReplacement(stateRef.current, DECK)
    stateRef.current = r.state
    setResult(r.item)
    setDrawKey((k) => k + 1)
    setRemaining(r.state.remaining.length)
    if (r.poolExhausted) setExhaustedWarning(true)
  }, [exhaustedWarning])

  const reshuffle = useCallback(() => {
    stateRef.current = buildDeck()
    setResult(null)
    setDrawKey((k) => k + 1)
    setRemaining(DECK.length)
    setExhaustedWarning(false)
  }, [])

  const cardValue = result?.value ?? ''
  const suit = cardValue.slice(-1)
  const rank = cardValue.slice(0, -1)
  const isRed = RED_SUITS.has(suit)

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Card Draw</h2>
      <p className="mt-1 text-sm text-white/60">
        {remaining} / {DECK.length} remaining ·{' '}
        <button type="button" className="underline hover:text-white" onClick={reshuffle}>
          Reshuffle
        </button>
      </p>

      <div className="mt-10 flex items-center justify-center">
        <div
          key={drawKey}
          className={`w-36 h-52 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl ${
            result
              ? 'bg-white'
              : 'bg-ink-veil ring-2 ring-white/20'
          }`}
        >
          {result ? (
            <div className={`flex flex-col items-center gap-1 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              <span className="text-display text-3xl font-bold">{rank}</span>
              <span className="text-5xl leading-none">{suit}</span>
            </div>
          ) : (
            <span className="text-display text-4xl text-white/40">🂠</span>
          )}
        </div>
      </div>

      {exhaustedWarning && (
        <p className="mt-4 text-neon-orange text-sm">
          Deck exhausted.{' '}
          <button type="button" className="underline hover:text-white" onClick={reshuffle}>
            Reshuffle
          </button>
        </p>
      )}

      <button
        type="button"
        onClick={draw}
        disabled={exhaustedWarning}
        className="mt-8 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-pink to-neon-magenta text-white shadow-[0_0_40px_-8px_rgba(255,43,214,0.7)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {result ? 'Draw Again' : 'Draw'}
      </button>
    </section>
  )
}
