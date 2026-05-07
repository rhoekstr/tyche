import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerPack } from '@/hooks/usePacks'
import { storageGet, storageSet } from '@/utils/storage'
import { inferDefaultAnimation } from '@/utils/inferAnimation'
import type { FilterSchema, FilterValues, Pack, PackItem } from '@/types/pack'

const CUSTOM_PACKS_KEY = 'custom-packs'

export function loadCustomPacks(): Pack[] {
  return storageGet<Pack[]>(CUSTOM_PACKS_KEY) ?? []
}

export function saveCustomPack(pack: Pack) {
  const existing = loadCustomPacks()
  const updated = [...existing.filter((p) => p.id !== pack.id), pack]
  storageSet(CUSTOM_PACKS_KEY, updated)
  registerPack(pack)
}

export function deleteCustomPack(id: string) {
  const existing = loadCustomPacks()
  storageSet(CUSTOM_PACKS_KEY, existing.filter((p) => p.id !== id))
}

interface ItemDraft {
  value: string
  icon: string
  shortLabel: string
  filters: Record<string, string[]>
}

interface FilterDraft {
  /** schema key (e.g. "park") */
  key: string
  /** display label (e.g. "Park") */
  label: string
  multiSelect: boolean
  values: string[]
}

const emptyItem = (): ItemDraft => ({ value: '', icon: '', shortLabel: '', filters: {} })

export default function CustomPackBuilder() {
  const [tab, setTab] = useState<'form' | 'json'>('form')

  // Pack meta
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('📋')
  const [description, setDescription] = useState('')

  // Items + filters
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [filters, setFilters] = useState<FilterDraft[]>([])
  const [bulkText, setBulkText] = useState('')

  // JSON tab
  const [jsonRaw, setJsonRaw] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Save feedback + saved list
  const [saved, setSaved] = useState(false)
  const [savedPacks, setSavedPacks] = useState<Pack[]>(loadCustomPacks)

  function buildPackFromForm(): Pack | null {
    const cleanItems: PackItem[] = items
      .map((it) => ({
        value: it.value.trim(),
        icon: it.icon.trim(),
        shortLabel: it.shortLabel.trim(),
        filters: it.filters,
      }))
      .filter((it) => it.value.length > 0)
      .map((it) => {
        const out: PackItem = { value: it.value }
        if (it.icon) out.icon = it.icon
        if (it.shortLabel) out.shortLabel = it.shortLabel
        const fv: FilterValues = {}
        for (const [k, v] of Object.entries(it.filters)) {
          if (v && v.length > 0) fv[k] = v
        }
        if (Object.keys(fv).length > 0) out.filters = fv
        return out
      })
    if (!title.trim() || cleanItems.length === 0) return null

    const schema: FilterSchema = {}
    const defaults: FilterValues = {}
    for (const f of filters) {
      const key = f.key.trim()
      const label = f.label.trim() || key
      const values = f.values.map((v) => v.trim()).filter(Boolean)
      if (!key || values.length === 0) continue
      schema[key] = { label, multiSelect: f.multiSelect }
      defaults[key] = [...values]
    }
    const hasFilters = Object.keys(schema).length > 0

    return {
      id: `custom-${Date.now()}`,
      version: '1.0',
      meta: {
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim() || '📋',
        defaultAnimation: inferDefaultAnimation(cleanItems.length),
        tags: ['custom'],
        hierarchy: { level1: 'Custom', level2: title.trim() },
        source: 'custom',
      },
      ...(hasFilters && { filters: schema, defaultFilters: defaults }),
      items: cleanItems,
      sampling: { replacement: true },
    }
  }

  function handleFormSave() {
    const pack = buildPackFromForm()
    if (!pack) return
    saveCustomPack(pack)
    setSavedPacks(loadCustomPacks())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setTitle('')
    setDescription('')
    setItems([emptyItem()])
    setFilters([])
  }

  function handleJsonSave() {
    setJsonError('')
    try {
      const pack = JSON.parse(jsonRaw) as Pack
      if (!pack.id || !pack.meta || !Array.isArray(pack.items)) {
        setJsonError('Invalid pack schema — must have id, meta, and items array.')
        return
      }
      pack.meta.source = 'custom'
      if (!pack.meta.defaultAnimation) {
        pack.meta.defaultAnimation = inferDefaultAnimation(pack.items.length)
      }
      saveCustomPack(pack)
      setSavedPacks(loadCustomPacks())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setJsonRaw('')
    } catch (e) {
      setJsonError(`JSON parse error: ${(e as Error).message}`)
    }
  }

  function handleDelete(id: string) {
    deleteCustomPack(id)
    setSavedPacks(loadCustomPacks())
  }

  function exportPack(pack: Pack) {
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pack.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Item operations ──────────────────────────────────────────────────────
  const updateItem = (idx: number, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const toggleItemFilter = (idx: number, dimKey: string, val: string, multiSelect: boolean) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const current = it.filters[dimKey] ?? []
        let next: string[]
        if (multiSelect) {
          next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
        } else {
          next = current.includes(val) ? [] : [val]
        }
        return { ...it, filters: { ...it.filters, [dimKey]: next } }
      }),
    )
  }
  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setItems((prev) => {
      const draftsFromBulk = lines.map<ItemDraft>((value) => ({ ...emptyItem(), value }))
      const filteredPrev = prev.filter((it) => it.value.trim())
      return [...filteredPrev, ...draftsFromBulk]
    })
    setBulkText('')
  }

  // ── Filter operations ────────────────────────────────────────────────────
  const updateFilter = (idx: number, patch: Partial<FilterDraft>) =>
    setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  const removeFilter = (idx: number) => {
    const removed = filters[idx]
    setFilters((prev) => prev.filter((_, i) => i !== idx))
    if (removed) {
      setItems((prev) =>
        prev.map((it) => {
          if (!it.filters[removed.key]) return it
          const { [removed.key]: _drop, ...rest } = it.filters
          return { ...it, filters: rest }
        }),
      )
    }
  }
  const addFilter = () =>
    setFilters((prev) => [
      ...prev,
      { key: `filter${prev.length + 1}`, label: `Filter ${prev.length + 1}`, multiSelect: true, values: [] },
    ])
  const updateFilterValues = (idx: number, raw: string) => {
    const values = raw.split(',').map((v) => v.trim()).filter(Boolean)
    updateFilter(idx, { values })
  }

  return (
    <section className="mx-auto max-w-3xl pt-6 pb-12">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">New List</h2>
      <p className="mt-2 text-white/60 text-sm">
        Build a list with optional icons, short labels, and filters — or import a pack JSON file.
      </p>

      <div className="mt-6 flex gap-2">
        {(['form', 'json'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm uppercase tracking-widest transition ${
              tab === t
                ? 'bg-neon-violet/30 text-neon-magenta ring-1 ring-neon-violet/50'
                : 'text-white/60 hover:text-white bg-ink-veil ring-1 ring-white/15'
            }`}
          >
            {t === 'form' ? 'Form Builder' : 'Import JSON'}
          </button>
        ))}
      </div>

      {tab === 'form' && (
        <div className="mt-6 space-y-6">
          {/* Meta */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎯"
                className="w-16 px-3 py-3 text-center rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white text-xl"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="List title…"
                className="flex-1 px-4 py-3 rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white placeholder:text-white/40"
              />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full px-4 py-3 rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white placeholder:text-white/40"
            />
          </div>

          {/* Filters */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-white/60">Filters (optional)</h3>
              <button
                type="button"
                onClick={addFilter}
                className="text-xs uppercase tracking-widest text-neon-cyan/80 hover:text-neon-cyan"
              >
                + Add Filter
              </button>
            </div>
            {filters.length === 0 && (
              <p className="text-xs text-white/40">
                Add filters like “Park” or “Difficulty” to let users narrow results.
              </p>
            )}
            <div className="space-y-3">
              {filters.map((f, idx) => (
                <div key={idx} className="rounded-xl bg-ink-veil ring-1 ring-white/10 p-3 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={f.key}
                      onChange={(e) => updateFilter(idx, { key: e.target.value.replace(/\s+/g, '') })}
                      placeholder="key"
                      className="px-3 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet w-32"
                    />
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateFilter(idx, { label: e.target.value })}
                      placeholder="Label"
                      className="px-3 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet flex-1 min-w-[8rem]"
                    />
                    <label className="flex items-center gap-2 text-white/70 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.multiSelect}
                        onChange={(e) => updateFilter(idx, { multiSelect: e.target.checked })}
                        className="accent-neon-violet w-4 h-4"
                      />
                      Multi-select
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFilter(idx)}
                      className="text-white/30 hover:text-neon-pink text-lg leading-none"
                      aria-label="Remove filter"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={f.values.join(', ')}
                    onChange={(e) => updateFilterValues(idx, e.target.value)}
                    placeholder="Values, comma separated (e.g. EPCOT, Magic Kingdom, …)"
                    className="w-full px-3 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-white/60">
                Items ({items.filter((i) => i.value.trim()).length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs uppercase tracking-widest text-neon-acid/80 hover:text-neon-acid"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl bg-ink-veil ring-1 ring-white/10 p-3 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      value={it.value}
                      onChange={(e) => updateItem(idx, { value: e.target.value })}
                      placeholder="Value (required)"
                      className="flex-1 min-w-[10rem] px-3 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet"
                    />
                    <input
                      type="text"
                      value={it.icon}
                      onChange={(e) => updateItem(idx, { icon: e.target.value })}
                      placeholder="🌶"
                      title="Icon (emoji)"
                      className="w-14 px-2 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-base text-center outline-none focus:ring-neon-violet"
                    />
                    <input
                      type="text"
                      value={it.shortLabel}
                      onChange={(e) => updateItem(idx, { shortLabel: e.target.value })}
                      placeholder="Short label"
                      title="Short label (used when value too long for a face)"
                      className="w-32 px-3 py-1.5 rounded-lg bg-ink-soft ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="text-white/30 hover:text-neon-pink text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>

                  {filters.length > 0 && (
                    <div className="space-y-1.5">
                      {filters.map((f) => {
                        const selected = new Set(it.filters[f.key] ?? [])
                        const usableValues = f.values.filter(Boolean)
                        if (usableValues.length === 0) return null
                        return (
                          <div key={f.key} className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 w-16 shrink-0">
                              {f.label}
                            </span>
                            {usableValues.map((v) => {
                              const on = selected.has(v)
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => toggleItemFilter(idx, f.key, v, f.multiSelect)}
                                  className={`px-2 py-0.5 rounded-full text-xs transition ${
                                    on
                                      ? 'bg-neon-violet/30 text-white ring-1 ring-neon-violet'
                                      : 'bg-ink-soft text-white/55 ring-1 ring-white/15 hover:text-white hover:ring-white/30'
                                  }`}
                                >
                                  {v}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bulk add */}
            <div className="mt-4 rounded-xl bg-ink-soft/60 ring-1 ring-white/10 p-3">
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5">
                Bulk add (one value per line)
              </label>
              <div className="flex gap-2">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={3}
                  placeholder={'Pizza\nPasta\nRamen'}
                  className="flex-1 px-3 py-2 rounded-lg bg-ink-veil ring-1 ring-white/15 text-white text-sm outline-none focus:ring-neon-violet resize-y font-mono"
                />
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={!bulkText.trim()}
                  className="self-end px-3 py-2 rounded-lg text-xs uppercase tracking-widest bg-neon-acid/20 text-neon-acid ring-1 ring-neon-acid/40 hover:bg-neon-acid/30 transition disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleFormSave}
            disabled={!title.trim() || items.filter((i) => i.value.trim()).length === 0}
            className="px-8 py-3 rounded-full text-display uppercase tracking-widest bg-gradient-to-r from-neon-acid to-neon-cyan text-ink hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {saved ? '✓ Saved!' : 'Save Pack'}
          </button>
        </div>
      )}

      {tab === 'json' && (
        <div className="mt-6 space-y-4">
          <textarea
            value={jsonRaw}
            onChange={(e) => { setJsonRaw(e.target.value); setJsonError('') }}
            rows={14}
            placeholder={'{\n  "id": "my-pack",\n  "version": "1.0",\n  "meta": { ... },\n  "items": [ ... ]\n}'}
            className="w-full px-4 py-3 rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white/90 placeholder:text-white/30 resize-y font-mono text-sm"
          />
          {jsonError && <p className="text-neon-pink text-sm">{jsonError}</p>}
          <button
            type="button"
            onClick={handleJsonSave}
            disabled={!jsonRaw.trim()}
            className="px-8 py-3 rounded-full text-display uppercase tracking-widest bg-gradient-to-r from-neon-acid to-neon-cyan text-ink hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {saved ? '✓ Imported!' : 'Import Pack'}
          </button>
        </div>
      )}

      {savedPacks.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Your Lists</h3>
          <ul className="space-y-3">
            {savedPacks.map((pack) => (
              <li key={pack.id} className="flex items-center gap-4 p-4 rounded-2xl bg-ink-veil ring-1 ring-white/10">
                <span className="text-2xl">{pack.meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{pack.meta.title}</div>
                  <div className="text-xs text-white/50">{pack.items.length} items</div>
                </div>
                <Link
                  to={`/pack/${pack.id}`}
                  className="text-xs uppercase tracking-widest text-neon-cyan/80 hover:text-neon-cyan"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => exportPack(pack)}
                  className="text-xs uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pack.id)}
                  className="text-xs text-neon-pink/60 hover:text-neon-pink uppercase tracking-widest"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
