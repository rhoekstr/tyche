import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useManifest } from '@/hooks/usePacks'
import { UTILITIES } from './UtilityStrip'
import type { ManifestEntry } from '@/types/pack'

function scoreSearch(entry: ManifestEntry, query: string): number {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  const haystack = [
    entry.meta.title,
    entry.meta.description,
    ...entry.meta.tags,
    entry.meta.hierarchy.level1,
    entry.meta.hierarchy.level2,
    entry.meta.hierarchy.level3 ?? '',
  ]
    .join(' ')
    .toLowerCase()
  const hits = words.filter((w) => haystack.includes(w)).length
  return hits / words.length
}

export default function Home() {
  const { manifest, loading, error } = useManifest()
  const [query, setQuery] = useState('')

  const packs = manifest?.packs ?? []

  const filtered = useMemo(() => {
    if (!query.trim()) return packs
    return packs
      .map((e) => ({ entry: e, score: scoreSearch(e, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ entry }) => entry)
  }, [packs, query])

  // Group by level1 when no search query
  const grouped = useMemo(() => {
    if (query.trim()) return null
    const map = new Map<string, ManifestEntry[]>()
    for (const e of filtered) {
      const key = e.meta.hierarchy.level1
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [filtered, query])

  return (
    <section className="mx-auto max-w-4xl pt-4 page-enter">
      <p className="text-center text-white/70 leading-relaxed mb-6 hidden sm:block">
        A psychedelic randomizer for{' '}
        <span className="text-neon-magenta neon-pulse">decisions</span>,{' '}
        <span className="text-neon-acid neon-pulse" style={{ animationDelay: '0.3s' }}>dares</span>,
        {' '}and{' '}
        <span className="text-neon-cyan neon-pulse" style={{ animationDelay: '0.6s' }}>daily delight</span>.
      </p>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          placeholder="Search lists…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-ink-veil ring-1 ring-white/15 focus:ring-neon-violet outline-none text-white placeholder:text-white/40 text-sm"
        />
      </div>

      {/* Utilities — hidden when searching */}
      {!query && (
        <>
          <h2 className="mt-8 text-display text-xl uppercase tracking-[0.25em] text-neon-yellow">
            Utilities
          </h2>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {UTILITIES.map(({ path, emoji, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl bg-ink-soft/60 ring-1 ring-white/10 hover:ring-neon-yellow hover:-translate-y-0.5 transition text-center"
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-display text-sm uppercase tracking-widest text-white">
                    {label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Lists */}
      <h2 className="mt-8 text-display text-xl uppercase tracking-[0.25em] text-neon-acid">
        {query ? `Results (${filtered.length})` : 'Lists'}
      </h2>

      {loading && <p className="mt-4 text-white/60">Loading packs…</p>}
      {error && <p className="mt-4 text-neon-pink">Failed to load manifest: {error.message}</p>}
      {!loading && filtered.length === 0 && query && (
        <p className="mt-4 text-white/60">No lists match "{query}".</p>
      )}

      {/* Flat search results */}
      {query && filtered.length > 0 && (
        <PackGrid entries={filtered} />
      )}

      {/* Grouped hierarchy browse */}
      {!query && grouped && (
        <div className="space-y-6 mt-4">
          {Array.from(grouped.entries()).map(([level1, entries]) => (
            <div key={level1}>
              <h3 className="text-xs uppercase tracking-[0.3em] text-neon-cyan/70 mb-3">
                {level1}
              </h3>
              <PackGrid entries={entries} />
            </div>
          ))}
        </div>
      )}

      {/* Suggest a list */}
      <div className="mt-12 mb-8 flex flex-col items-center gap-3 text-center">
        <p className="text-white/50 text-sm">Got an idea for a new list?</p>
        <a
          href="mailto:coffee@awrylabs.com?subject=Tyche%20List%20Suggestion"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
            bg-ink-soft/60 ring-1 ring-white/15
            hover:ring-neon-violet hover:text-neon-violet hover:-translate-y-0.5
            text-white/70 text-sm font-medium transition-all duration-200"
        >
          <span>✨</span>
          <span>Suggest a List</span>
        </a>
      </div>
    </section>
  )
}

function PackGrid({ entries }: { entries: ManifestEntry[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            to={`/pack/${entry.id}`}
            className="group block rounded-2xl p-5 bg-ink-soft/70 ring-1 ring-white/10
              hover:ring-neon-magenta hover:-translate-y-1
              hover:shadow-[0_0_30px_-8px_rgba(255,43,214,0.5)]
              transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                {entry.meta.icon}
              </div>
              <div className="min-w-0">
                <div className="text-display text-lg text-white truncate group-hover:text-neon-magenta transition-colors">
                  {entry.meta.title}
                </div>
                <div className="text-sm text-white/70 line-clamp-2">
                  {entry.meta.description}
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-neon-cyan/80">
                  {entry.meta.hierarchy.level2}
                  {entry.meta.hierarchy.level3 ? ` · ${entry.meta.hierarchy.level3}` : ''}
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
