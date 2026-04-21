import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePack } from '@/hooks/usePacks'
import { useRandomizer } from '@/hooks/useRandomizer'
import { useFilters } from '@/hooks/useFilters'
import { usePreferences } from '@/hooks/usePreferences'
import AnimationStage from '@/components/animations/AnimationStage'
import AnimationPicker from '@/components/animations/AnimationPicker'
import FilterPanel from './FilterPanel'
import type { AnimationMode } from '@/types/pack'

export default function Randomizer() {
  const { id } = useParams<{ id: string }>()
  const { pack, loading, error } = usePack(id)

  const filters = useFilters(pack ?? null)
  const randomizer = useRandomizer(pack ?? null, filters.activeFilters)

  const [animMode, setAnimMode] = useState<AnimationMode | null>(null)
  const effectiveMode: AnimationMode = animMode ?? pack?.meta.defaultAnimation ?? 'slot'
  const { durationFor } = usePreferences()

  if (loading) return <Status>Loading pack…</Status>
  if (error) return <Status tone="error">Failed to load: {error.message}</Status>
  if (!pack) return <Status>Pack not found.</Status>

  return (
    <section className="mx-auto max-w-2xl pt-6 page-enter">
      <Link
        to="/"
        className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white"
      >
        ← Home
      </Link>

      <header className="mt-6 text-center">
        <div className="text-5xl">{pack.meta.icon}</div>
        <h2 className="mt-2 text-display text-3xl md:text-4xl text-white">
          {pack.meta.title}
        </h2>
        <p className="mt-2 text-white/70">{pack.meta.description}</p>
      </header>

      <div className="mt-5 flex flex-col items-center gap-3">
        <FilterPanel pack={pack} api={filters} />
        <AnimationPicker value={effectiveMode} onChange={setAnimMode} />
      </div>

      {randomizer.pool.length === 0 && (
        <p className="mt-4 text-center text-neon-orange text-sm">
          No items match the current filters — loosen them to spin.
        </p>
      )}

      <div className="mt-8">
        <AnimationStage
          mode={effectiveMode}
          pool={randomizer.pool}
          result={randomizer.result}
          spinId={randomizer.spinId}
          isSpinning={randomizer.isSpinning}
          onComplete={randomizer.markSpinComplete}
          durationMs={durationFor(effectiveMode)}
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={randomizer.spin}
          disabled={!randomizer.canSpin}
          className={`text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-magenta via-neon-violet to-neon-cobalt text-white hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ${
            randomizer.isSpinning ? 'btn-spin-active' : 'shadow-[0_0_40px_-8px_rgba(255,43,214,0.8)]'
          }`}
        >
          {randomizer.isSpinning ? 'Spinning…' : randomizer.result ? 'Re-roll' : 'Spin'}
        </button>

        {randomizer.showRemaining && (
          <div className="text-sm text-white/60">
            {randomizer.remaining} remaining ·{' '}
            <button className="underline hover:text-white" onClick={randomizer.reshuffle} type="button">
              Reshuffle
            </button>
          </div>
        )}

        {randomizer.warning?.kind === 'pool-exhausted' && (
          <Status tone="warn">
            Pool exhausted.{' '}
            {randomizer.warning.mode === 'block' ? (
              <button className="underline" onClick={randomizer.reshuffle}>Reshuffle</button>
            ) : (
              <button className="underline" onClick={randomizer.acknowledgeWarning}>OK</button>
            )}
          </Status>
        )}
      </div>
    </section>
  )
}

function Status({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' | 'error' }) {
  const colors = { info: 'text-white/70', warn: 'text-neon-orange', error: 'text-neon-pink' } as const
  return <p className={`text-center mt-8 ${colors[tone]}`}>{children}</p>
}
