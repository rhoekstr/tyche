import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerPack } from '@/hooks/usePacks'
import { storageGet, storageSet } from '@/utils/storage'
import type { Pack, PackItem } from '@/types/pack'

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

export default function CustomPackBuilder() {
  const [tab, setTab] = useState<'form' | 'json'>('form')
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('📋')
  const [description, setDescription] = useState('')
  const [itemsRaw, setItemsRaw] = useState('')
  const [jsonRaw, setJsonRaw] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [saved, setSaved] = useState(false)
  const [savedPacks, setSavedPacks] = useState<Pack[]>(loadCustomPacks)

  function buildPackFromForm(): Pack | null {
    const items: PackItem[] = itemsRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((value) => ({ value }))
    if (!title.trim() || items.length === 0) return null
    return {
      id: `custom-${Date.now()}`,
      version: '1.0',
      meta: {
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim() || '📋',
        defaultAnimation: 'slot',
        tags: ['custom'],
        hierarchy: { level1: 'Custom', level2: title.trim() },
        source: 'custom',
      },
      items,
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
    setTitle(''); setDescription(''); setItemsRaw('')
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

  return (
    <section className="mx-auto max-w-2xl pt-6">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Custom Packs</h2>
      <p className="mt-2 text-white/60 text-sm">
        Build a custom list or import a pack JSON file.
      </p>

      {/* Tab switcher */}
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

      {/* Form builder */}
      {tab === 'form' && (
        <div className="mt-6 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Icon"
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
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Items (one per line)
            </label>
            <textarea
              value={itemsRaw}
              onChange={(e) => setItemsRaw(e.target.value)}
              rows={8}
              placeholder={'Hawaiian pizza\nFalafel wrap\nPad Thai\n…'}
              className="w-full px-4 py-3 rounded-xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white placeholder:text-white/40 resize-y font-mono text-sm"
            />
            <p className="text-xs text-white/40 mt-1">
              {itemsRaw.split('\n').filter((l) => l.trim()).length} items
            </p>
          </div>
          <button
            type="button"
            onClick={handleFormSave}
            disabled={!title.trim() || !itemsRaw.trim()}
            className="px-8 py-3 rounded-full text-display uppercase tracking-widest bg-gradient-to-r from-neon-acid to-neon-cyan text-ink hover:brightness-110 active:scale-95 transition disabled:opacity-40"
          >
            {saved ? '✓ Saved!' : 'Save Pack'}
          </button>
        </div>
      )}

      {/* JSON import */}
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

      {/* Saved custom packs */}
      {savedPacks.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Your Custom Packs</h3>
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
