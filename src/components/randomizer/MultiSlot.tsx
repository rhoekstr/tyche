import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useManifest, usePack } from '@/hooks/usePacks'
import { useMultiRandomizer } from '@/hooks/useMultiRandomizer'
import { defaultActiveFilters } from '@/utils/randomize'
import { storageGet, storageSet } from '@/utils/storage'
import AnimationStage from '@/components/animations/AnimationStage'
import type { MultiSlotConfig, SlotConfig } from '@/types/config'
import type { AnimationMode } from '@/types/pack'

const SAVED_KEY = 'multi-configs'

export default function MultiSlot() {
  const { manifest } = useManifest()
  const multi = useMultiRandomizer(2)
  const [configName, setConfigName] = useState('')
  const [savedConfigs, setSavedConfigs] = useState<MultiSlotConfig[]>(
    () => storageGet<MultiSlotConfig[]>(SAVED_KEY) ?? [],
  )
  const [showSaved, setShowSaved] = useState(false)

  function saveConfig() {
    if (!configName.trim()) return
    const config: MultiSlotConfig = {
      id: `cfg-${Date.now()}`,
      name: configName.trim(),
      slots: multi.slots.map((s): SlotConfig => ({
        id: s.id,
        packId: s.packId ?? '',
        filters: s.activeFilters,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const next = [...savedConfigs.filter((c) => c.name !== config.name), config]
    setSavedConfigs(next)
    storageSet(SAVED_KEY, next)
    setConfigName('')
  }

  function deleteConfig(id: string) {
    const next = savedConfigs.filter((c) => c.id !== id)
    setSavedConfigs(next)
    storageSet(SAVED_KEY, next)
  }

  function exportConfig() {
    const data = JSON.stringify(savedConfigs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tyche-configs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importConfig(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as MultiSlotConfig[]
        if (Array.isArray(parsed)) {
          const merged = [
            ...savedConfigs,
            ...parsed.filter((c) => !savedConfigs.find((s) => s.id === c.id)),
          ]
          setSavedConfigs(merged)
          storageSet(SAVED_KEY, merged)
        }
      } catch {
        // bad JSON — ignore
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="mx-auto max-w-3xl pt-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
          ← Home
        </Link>
        <button
          type="button"
          onClick={() => setShowSaved((v) => !v)}
          className="text-sm uppercase tracking-widest text-neon-cyan/80 hover:text-neon-cyan"
        >
          {showSaved ? 'Hide Saved' : 'Saved Configs'} ({savedConfigs.length})
        </button>
      </div>

      <h2 className="text-display text-3xl text-white mb-2">Multi-Slot</h2>
      <p className="text-white/60 text-sm mb-8">Spin up to 8 lists at once for combo decisions.</p>

      {/* Saved configs panel */}
      {showSaved && (
        <div className="mb-8 rounded-2xl bg-ink-veil ring-1 ring-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-white/60">Saved</span>
            <div className="flex gap-3 text-xs">
              <button type="button" onClick={exportConfig} className="text-neon-cyan/80 hover:text-neon-cyan uppercase tracking-widest">
                Export JSON
              </button>
              <label className="text-neon-acid/80 hover:text-neon-acid uppercase tracking-widest cursor-pointer">
                Import
                <input type="file" accept=".json" className="hidden" onChange={importConfig} />
              </label>
            </div>
          </div>
          {savedConfigs.length === 0 && <p className="text-white/40 text-sm">No saved configurations yet.</p>}
          <ul className="space-y-2">
            {savedConfigs.map((cfg) => (
              <li key={cfg.id} className="flex items-center justify-between gap-3">
                <span className="text-white text-sm">{cfg.name}</span>
                <span className="text-white/40 text-xs">{cfg.slots.length} slots</span>
                <button
                  type="button"
                  onClick={() => deleteConfig(cfg.id)}
                  className="text-xs text-neon-pink/60 hover:text-neon-pink uppercase tracking-widest"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Slots */}
      <div className="space-y-4">
        {multi.slots.map((slot, idx) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            index={idx}
            packOptions={manifest?.packs.map((p) => ({ id: p.id, label: p.meta.title, icon: p.meta.icon })) ?? []}
            onPackChange={(packId, pack) => {
              const filters = pack ? defaultActiveFilters(pack) : {}
              multi.updateSlot(slot.id, { packId, pack, activeFilters: filters })
            }}
            onRemove={multi.slots.length > 1 ? () => multi.removeSlot(slot.id) : undefined}
          />
        ))}
      </div>

      {multi.slots.length < 8 && (
        <button
          type="button"
          onClick={multi.addSlot}
          className="mt-4 w-full py-3 rounded-2xl ring-1 ring-dashed ring-white/20 text-white/40 hover:text-white hover:ring-white/40 text-sm uppercase tracking-widest transition"
        >
          + Add Slot
        </button>
      )}

      {/* Results */}
      {multi.slots.some((s) => s.result) && (
        <div className="mt-10">
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-acid mb-6 text-center">Result</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {multi.slots.filter((s) => s.packId).map((slot) => (
              <div key={slot.id} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-ink-veil ring-1 ring-white/10">
                {slot.pack && (
                  <p className="text-xs uppercase tracking-widest text-white/60">{slot.pack.meta.icon} {slot.pack.meta.title}</p>
                )}
                <AnimationStage
                  mode={(slot.pack?.meta.defaultAnimation ?? 'slot') as AnimationMode}
                  pool={slot.pack ? slot.pack.items : []}
                  result={slot.result}
                  spinId={slot.spinId}
                  isSpinning={slot.isSpinning}
                  onComplete={() => {}}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spin + save */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={multi.spin}
          disabled={!multi.canSpin}
          className="text-display text-xl uppercase tracking-widest px-12 py-5 rounded-full bg-gradient-to-r from-neon-magenta via-neon-violet to-neon-cobalt text-white shadow-[0_0_50px_-8px_rgba(255,43,214,0.9)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {multi.isAnySpinning ? 'Spinning…' : 'Spin All'}
        </button>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveConfig()}
            placeholder="Name this config…"
            className="px-4 py-2 rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white text-sm placeholder:text-white/40 w-52"
          />
          <button
            type="button"
            onClick={saveConfig}
            disabled={!configName.trim()}
            className="px-4 py-2 rounded-xl text-sm uppercase tracking-widest bg-neon-violet/20 text-neon-magenta ring-1 ring-neon-violet/40 hover:bg-neon-violet/30 transition disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Slot card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  index,
  packOptions,
  onPackChange,
  onRemove,
}: {
  slot: ReturnType<typeof useMultiRandomizer>['slots'][number]
  index: number
  packOptions: { id: string; label: string; icon: string }[]
  onPackChange: (packId: string, pack: import('@/types/pack').Pack | null) => void
  onRemove?: () => void
}) {
  const { pack } = usePack(slot.packId)

  // When pack data arrives, sync it into the multi-slot state
  useEffect(() => {
    if (pack && pack.id === slot.packId && slot.pack?.id !== pack.id) {
      onPackChange(pack.id, pack)
    }
  }, [pack, slot.packId, slot.pack, onPackChange])

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-ink-soft/60 ring-1 ring-white/10">
      <div className="text-display text-neon-violet/60 text-sm w-6 text-center shrink-0">
        {index + 1}
      </div>

      <select
        value={slot.packId ?? ''}
        onChange={(e) => {
          const val = e.target.value
          if (!val) { onPackChange('', null); return }
          onPackChange(val, null) // pack data arrives via usePack in effect
        }}
        className="flex-1 bg-ink-veil text-white text-sm rounded-xl px-3 py-2 ring-1 ring-white/15 focus:ring-neon-violet outline-none appearance-none cursor-pointer"
      >
        <option value="">Select a list…</option>
        {packOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.icon} {opt.label}
          </option>
        ))}
      </select>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-white/30 hover:text-neon-pink text-lg shrink-0 leading-none"
          aria-label="Remove slot"
        >
          ×
        </button>
      )}
    </div>
  )
}
