import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useManifest, usePack } from '@/hooks/usePacks'
import { useMultiRandomizer } from '@/hooks/useMultiRandomizer'
import { defaultActiveFilters } from '@/utils/randomize'
import { storageGet, storageSet } from '@/utils/storage'
import { ensureUtilityPacksRegistered, UTILITY_PACK_OPTIONS } from '@/utils/utilityPacks'
import AnimationStage from '@/components/animations/AnimationStage'
import ResultLabel from '@/components/animations/ResultLabel'
import { useSound } from '@/hooks/useSound'
import type { MultiSlotConfig, SlotConfig } from '@/types/config'
import type { AnimationMode, FilterValues, Pack } from '@/types/pack'

const SAVED_KEY = 'multi-configs'

const ANIMATION_OPTIONS: { mode: AnimationMode; emoji: string; label: string }[] = [
  { mode: 'slot', emoji: '🎰', label: 'Slot' },
  { mode: 'coin', emoji: '🪙', label: 'Coin' },
  { mode: 'dice', emoji: '🎲', label: 'Dice' },
  { mode: 'card', emoji: '🃏', label: 'Card' },
  { mode: 'rps', emoji: '✊', label: 'RPS' },
]

ensureUtilityPacksRegistered()

export default function MultiSlot() {
  const { manifest } = useManifest()
  const multi = useMultiRandomizer(2)
  const sound = useSound()
  const [configName, setConfigName] = useState('')
  const [savedConfigs, setSavedConfigs] = useState<MultiSlotConfig[]>(
    () => storageGet<MultiSlotConfig[]>(SAVED_KEY) ?? [],
  )
  const [showSaved, setShowSaved] = useState(false)

  // Play landing sound when all spins complete
  const wasSpinningRef = useRef(false)
  useEffect(() => {
    if (wasSpinningRef.current && !multi.isAnySpinning) {
      sound.playLand()
    }
    wasSpinningRef.current = multi.isAnySpinning
  }, [multi.isAnySpinning, sound])

  const handleSpin = () => {
    sound.playSpin()
    multi.spin()
  }

  const packOptions = useMemo<PackOption[]>(() => {
    const fromManifest =
      manifest?.packs.map((p) => ({
        id: p.id,
        label: p.meta.title,
        icon: p.meta.icon,
        group: 'Lists' as const,
      })) ?? []
    return [
      ...UTILITY_PACK_OPTIONS.map((u) => ({ ...u, group: 'Utilities' as const })),
      ...fromManifest,
    ]
  }, [manifest])

  function saveConfig() {
    if (!configName.trim()) return
    const config: MultiSlotConfig = {
      id: `cfg-${Date.now()}`,
      name: configName.trim(),
      slots: multi.slots.map((s): SlotConfig => ({
        id: s.id,
        packId: s.packId ?? '',
        filters: s.activeFilters,
        animation: s.animation ?? undefined,
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

      <h2 className="text-display text-3xl text-white mb-2">Custom Roll</h2>
      <p className="text-white/60 text-sm mb-8">Combine up to 8 lists or utilities and spin them together.</p>

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

      <div className="space-y-3">
        {multi.slots.map((slot, idx) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            index={idx}
            packOptions={packOptions}
            onPackChange={(packId, pack) => {
              const filters = pack ? defaultActiveFilters(pack) : {}
              multi.updateSlot(slot.id, { packId, pack, activeFilters: filters, animation: null })
            }}
            onAnimationChange={(animation) => {
              multi.updateSlot(slot.id, { animation })
            }}
            onFiltersChange={(activeFilters) => {
              multi.updateSlot(slot.id, { activeFilters })
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

      {multi.slots.some((s) => s.result) && (
        <div className="mt-10">
          <h3 className="text-display text-xl uppercase tracking-widest text-neon-acid mb-6 text-center">Result</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {multi.slots.filter((s) => s.packId).map((slot) => {
              const mode = slot.animation ?? slot.pack?.meta.defaultAnimation ?? 'slot'
              return (
                <div key={slot.id} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-ink-veil ring-1 ring-white/10">
                  {slot.pack && (
                    <p className="text-xs uppercase tracking-widest text-white/60">{slot.pack.meta.icon} {slot.pack.meta.title}</p>
                  )}
                  <AnimationStage
                    mode={mode}
                    pool={slot.pack ? slot.pack.items : []}
                    result={slot.result}
                    spinId={slot.spinId}
                    isSpinning={slot.isSpinning}
                    onComplete={() => {}}
                  />
                  {mode !== 'slot' && <ResultLabel item={slot.result} isSpinning={slot.isSpinning} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleSpin}
          disabled={!multi.canSpin}
          className="text-display text-xl uppercase tracking-widest px-12 py-5 rounded-full bg-gradient-to-r from-neon-magenta via-neon-violet to-neon-cobalt text-white shadow-[0_0_50px_-8px_rgba(255,43,214,0.9)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {multi.isAnySpinning ? 'Spinning…' : 'Roll All'}
        </button>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveConfig()}
            placeholder="Name this roll…"
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

interface PackOption {
  id: string
  label: string
  icon: string
  group: 'Utilities' | 'Lists'
}

function SlotCard({
  slot,
  index,
  packOptions,
  onPackChange,
  onAnimationChange,
  onFiltersChange,
  onRemove,
}: {
  slot: ReturnType<typeof useMultiRandomizer>['slots'][number]
  index: number
  packOptions: PackOption[]
  onPackChange: (packId: string, pack: Pack | null) => void
  onAnimationChange: (animation: AnimationMode | null) => void
  onFiltersChange: (filters: FilterValues) => void
  onRemove?: () => void
}) {
  const { pack } = usePack(slot.packId)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (pack && pack.id === slot.packId && slot.pack?.id !== pack.id) {
      onPackChange(pack.id, pack)
    }
  }, [pack, slot.packId, slot.pack, onPackChange])

  const utilities = packOptions.filter((p) => p.group === 'Utilities')
  const lists = packOptions.filter((p) => p.group === 'Lists')
  const effectiveAnimation = slot.animation ?? slot.pack?.meta.defaultAnimation ?? 'slot'
  const hasFilters = !!slot.pack?.filters && Object.keys(slot.pack.filters).length > 0

  // Active filter count vs. total possible
  const filterStats = (() => {
    if (!slot.pack?.filters) return { active: 0, total: 0 }
    let active = 0
    let total = 0
    for (const dim of Object.keys(slot.pack.filters)) {
      const allValues = new Set<string>()
      for (const it of slot.pack.items) for (const v of it.filters?.[dim] ?? []) allValues.add(v)
      total += allValues.size
      active += slot.activeFilters[dim]?.length ?? 0
    }
    return { active, total }
  })()
  const isFiltered = filterStats.active < filterStats.total

  return (
    <div className="rounded-2xl bg-ink-soft/60 ring-1 ring-white/10 p-3">
      <div className="flex items-center gap-2">
        <div className="text-display text-neon-violet/60 text-sm w-6 text-center shrink-0">
          {index + 1}
        </div>

        <select
          value={slot.packId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            if (!val) { onPackChange('', null); return }
            onPackChange(val, null)
          }}
          className="flex-1 min-w-0 bg-ink-veil text-white text-sm rounded-xl px-3 py-2 ring-1 ring-white/15 focus:ring-neon-violet outline-none cursor-pointer"
        >
          <option value="">Select…</option>
          {utilities.length > 0 && (
            <optgroup label="Utilities">
              {utilities.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
              ))}
            </optgroup>
          )}
          {lists.length > 0 && (
            <optgroup label="Lists">
              {lists.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
              ))}
            </optgroup>
          )}
        </select>

        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          disabled={!hasFilters}
          title={hasFilters ? 'Edit filters' : 'No filters available for this list'}
          aria-label="Edit filters"
          className={`shrink-0 w-9 h-9 rounded-xl ring-1 transition flex items-center justify-center ${
            !hasFilters
              ? 'opacity-30 ring-white/10 cursor-not-allowed'
              : isFiltered
              ? 'bg-neon-orange/20 ring-neon-orange/50 text-neon-orange'
              : 'bg-ink-veil ring-white/15 text-white/60 hover:text-white hover:ring-white/30'
          }`}
        >
          ⚙
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-white/30 hover:text-neon-pink text-lg shrink-0 leading-none w-6 text-center"
            aria-label="Remove slot"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 pl-8">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Anim</span>
        <select
          value={slot.animation ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onAnimationChange(val ? (val as AnimationMode) : null)
          }}
          disabled={!slot.packId}
          className="bg-ink-veil text-white text-xs rounded-lg px-2 py-1 ring-1 ring-white/15 focus:ring-neon-violet outline-none cursor-pointer disabled:opacity-40"
        >
          <option value="">Auto ({effectiveAnimation})</option>
          {ANIMATION_OPTIONS.map((opt) => (
            <option key={opt.mode} value={opt.mode}>{opt.emoji} {opt.label}</option>
          ))}
        </select>
      </div>

      {filtersOpen && hasFilters && slot.pack && (
        <SlotFilterEditor
          pack={slot.pack}
          activeFilters={slot.activeFilters}
          onChange={onFiltersChange}
        />
      )}
    </div>
  )
}

function SlotFilterEditor({
  pack,
  activeFilters,
  onChange,
}: {
  pack: Pack
  activeFilters: FilterValues
  onChange: (filters: FilterValues) => void
}) {
  if (!pack.filters) return null
  const dimensions = Object.keys(pack.filters)

  function toggle(dim: string, val: string, multiSelect: boolean) {
    const current = activeFilters[dim] ?? []
    const next = multiSelect
      ? current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
      : current.includes(val) ? [] : [val]
    onChange({ ...activeFilters, [dim]: next })
  }
  function selectAll(dim: string) {
    const allValues = new Set<string>()
    for (const it of pack.items) for (const v of it.filters?.[dim] ?? []) allValues.add(v)
    onChange({ ...activeFilters, [dim]: [...allValues] })
  }
  function clearAll(dim: string) {
    onChange({ ...activeFilters, [dim]: [] })
  }

  return (
    <div className="mt-3 ml-8 rounded-xl bg-ink-veil ring-1 ring-white/10 p-3 space-y-3">
      {dimensions.map((dim) => {
        const def = pack.filters![dim]!
        const allValues = Array.from(
          new Set(pack.items.flatMap((i) => i.filters?.[dim] ?? [])),
        ).sort()
        const selected = new Set(activeFilters[dim] ?? [])
        return (
          <div key={dim}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-white/60">{def.label}</span>
              <div className="flex gap-2 text-[10px]">
                <button type="button" onClick={() => selectAll(dim)} className="text-neon-cyan/80 hover:text-neon-cyan uppercase tracking-widest">All</button>
                <button type="button" onClick={() => clearAll(dim)} className="text-white/40 hover:text-white uppercase tracking-widest">None</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allValues.map((val) => {
                const on = selected.has(val)
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggle(dim, val, def.multiSelect)}
                    className={`px-2.5 py-0.5 rounded-full text-xs transition ${
                      on
                        ? 'bg-neon-violet/30 text-white ring-1 ring-neon-violet'
                        : 'bg-ink-soft text-white/55 ring-1 ring-white/15 hover:text-white hover:ring-white/30'
                    }`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
