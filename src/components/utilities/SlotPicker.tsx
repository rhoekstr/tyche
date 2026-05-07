import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPack, useManifest } from '@/hooks/usePacks'
import { usePreferences } from '@/hooks/usePreferences'
import { useSound } from '@/hooks/useSound'
import { drawWithReplacement } from '@/utils/randomize'
import SlotMachine from '@/components/animations/SlotMachine'
import type { Pack, PackItem } from '@/types/pack'

/** Generic slot-machine utility — pick any list and spin. */
export default function SlotPicker() {
  const { manifest } = useManifest()
  const { durationFor } = usePreferences()
  const sound = useSound()

  const [packId, setPackId] = useState<string>('')
  const [pack, setPack] = useState<Pack | null>(null)
  const [packLoading, setPackLoading] = useState(false)
  const [result, setResult] = useState<PackItem | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  const pickerOptions = useMemo(
    () => manifest?.packs.map((p) => ({ id: p.id, label: p.meta.title, icon: p.meta.icon })) ?? [],
    [manifest],
  )

  useEffect(() => {
    if (!packId) { setPack(null); setResult(null); return }
    setPackLoading(true)
    let cancelled = false
    fetchPack(packId)
      .then((p) => { if (!cancelled) { setPack(p); setResult(null) } })
      .catch(() => { if (!cancelled) setPack(null) })
      .finally(() => { if (!cancelled) setPackLoading(false) })
    return () => { cancelled = true }
  }, [packId])

  const spin = useCallback(() => {
    if (isSpinning || !pack) return
    const item = drawWithReplacement(pack.items)
    if (!item) return
    sound.playSpin()
    setResult(item)
    setSpinId((n) => n + 1)
    setIsSpinning(true)
  }, [isSpinning, pack, sound])

  const handleComplete = useCallback(() => {
    sound.playLand()
    setIsSpinning(false)
  }, [sound])

  const duration = useMemo(() => durationFor('slot'), [durationFor])

  return (
    <section className="mx-auto max-w-2xl pt-6">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Slot</h2>
      <p className="mt-2 text-sm text-white/60">Pick a list and spin the reel.</p>

      <div className="mt-6">
        <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">List</label>
        <select
          value={packId}
          onChange={(e) => setPackId(e.target.value)}
          disabled={isSpinning}
          className="w-full bg-ink-veil text-white text-sm rounded-xl px-4 py-3 ring-1 ring-white/15 focus:ring-neon-violet outline-none cursor-pointer disabled:opacity-50"
        >
          <option value="">Select a list…</option>
          {pickerOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
          ))}
        </select>
        {packLoading && <p className="mt-2 text-xs text-white/40">Loading…</p>}
      </div>

      {pack && (
        <p className="mt-3 text-xs text-white/50">
          {pack.items.length} items · <span className="text-white/70">{pack.meta.description}</span>
        </p>
      )}

      <div className="mt-8">
        <SlotMachine
          pool={pack?.items ?? []}
          result={result}
          spinId={spinId}
          isSpinning={isSpinning}
          onComplete={handleComplete}
          durationMs={duration}
        />
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={spin}
          disabled={!pack || isSpinning}
          className={`text-display text-xl uppercase tracking-widest px-10 py-4 rounded-full bg-gradient-to-r from-neon-magenta via-neon-violet to-neon-cobalt text-white hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ${
            isSpinning ? 'btn-spin-active' : 'shadow-[0_0_40px_-8px_rgba(255,43,214,0.8)]'
          }`}
        >
          {isSpinning ? 'Spinning…' : result ? 'Re-spin' : 'Spin'}
        </button>
      </div>
    </section>
  )
}

