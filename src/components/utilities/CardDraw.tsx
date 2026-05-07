import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { drawWithReplacement, drawWithoutReplacement, initDrawState, type DrawState } from '@/utils/randomize'
import CardAnimation from '@/components/animations/CardAnimation'
import ResultLabel from '@/components/animations/ResultLabel'
import { usePreferences } from '@/hooks/usePreferences'
import type { PackItem } from '@/types/pack'

const SUITS = ['♠', '♥', '♦', '♣'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

const DECK: PackItem[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ value: rank, icon: suit, shortLabel: `${rank}${suit}` })),
)

function buildDeck(): DrawState {
  return initDrawState(DECK)
}

export default function CardDraw() {
  const stateRef = useRef<DrawState>(buildDeck())
  const [withReplacement, setWithReplacement] = useState(false)
  const [result, setResult] = useState<PackItem | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [exhaustedWarning, setExhaustedWarning] = useState(false)
  const [remaining, setRemaining] = useState(DECK.length)
  const { durationFor } = usePreferences()

  const draw = useCallback(() => {
    if (isSpinning || exhaustedWarning) return
    let nextItem: PackItem | null = null
    if (withReplacement) {
      nextItem = drawWithReplacement(DECK)
    } else {
      const r = drawWithoutReplacement(stateRef.current, DECK)
      stateRef.current = r.state
      nextItem = r.item
      setRemaining(r.state.remaining.length)
      if (r.poolExhausted) setExhaustedWarning(true)
    }
    if (!nextItem) return
    setResult(nextItem)
    setSpinId((n) => n + 1)
    setIsSpinning(true)
  }, [isSpinning, exhaustedWarning, withReplacement])

  const reshuffle = useCallback(() => {
    stateRef.current = buildDeck()
    setResult(null)
    setSpinId((n) => n + 1)
    setRemaining(DECK.length)
    setExhaustedWarning(false)
    setIsSpinning(false)
  }, [])

  const handleComplete = useCallback(() => setIsSpinning(false), [])
  const duration = useMemo(() => durationFor('card'), [durationFor])

  return (
    <section className="mx-auto max-w-sm pt-6 text-center">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Card Draw</h2>

      <div className="mt-3 flex items-center justify-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-white/70 cursor-pointer">
          <input
            type="checkbox"
            checked={withReplacement}
            onChange={(e) => {
              setWithReplacement(e.target.checked)
              if (e.target.checked) {
                setExhaustedWarning(false)
              }
            }}
            disabled={isSpinning}
            className="accent-neon-magenta w-4 h-4"
          />
          With replacement
        </label>
      </div>

      {!withReplacement && (
        <p className="mt-2 text-xs text-white/50">
          {remaining} / {DECK.length} remaining ·{' '}
          <button type="button" className="underline hover:text-white" onClick={reshuffle}>
            Reshuffle
          </button>
        </p>
      )}

      <div className="mt-8">
        <CardAnimation
          pool={DECK}
          result={result}
          spinId={spinId}
          isSpinning={isSpinning}
          onComplete={handleComplete}
          durationMs={duration}
        />
        <ResultLabel item={result} isSpinning={isSpinning} />
      </div>

      {exhaustedWarning && !withReplacement && (
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
        disabled={isSpinning || (exhaustedWarning && !withReplacement)}
        className="mt-8 text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-pink to-neon-magenta text-white shadow-[0_0_40px_-8px_rgba(255,43,214,0.7)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Drawing…' : result ? 'Draw Again' : 'Draw'}
      </button>
    </section>
  )
}
