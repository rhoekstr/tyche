import { useState } from 'react'
import type { FiltersApi } from '@/hooks/useFilters'
import type { FilterSchema, Pack } from '@/types/pack'

interface Props {
  pack: Pack
  api: FiltersApi
}

export default function FilterPanel({ pack, api }: Props) {
  const [open, setOpen] = useState(false)
  const schema: FilterSchema = pack.filters ?? {}
  const dimensions = Object.keys(schema)
  if (dimensions.length === 0) return null

  const { activeCount, totalPossible } = api
  // Filters default to "none selected = no filter applied". The badge
  // lights up only when the user has actively selected at least one chip.
  const isFiltered = activeCount > 0

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-sm uppercase tracking-widest transition rounded-xl px-4 py-2 ${
          isFiltered
            ? 'text-neon-orange ring-1 ring-neon-orange/50 bg-neon-orange/10'
            : 'text-white/60 hover:text-white ring-1 ring-white/20 hover:ring-white/40'
        }`}
      >
        <span>Filters</span>
        {isFiltered && (
          <span className="text-xs bg-neon-orange/30 text-neon-orange px-2 py-0.5 rounded-full">
            {activeCount}/{totalPossible}
          </span>
        )}
        <span className="ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-2xl bg-ink-veil ring-1 ring-white/10 p-4 space-y-5">
          {dimensions.map((dim) => {
            const def = schema[dim]!
            const allValues = Array.from(
              new Set(pack.items.flatMap((i) => i.filters?.[dim] ?? [])),
            ).sort()
            const selected = new Set(api.activeFilters[dim] ?? [])

            return (
              <div key={dim}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-white/60">
                    {def.label}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      className="text-neon-cyan/80 hover:text-neon-cyan"
                      onClick={() => api.selectAll(dim)}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="text-white/40 hover:text-white"
                      onClick={() => api.clearAll(dim)}
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allValues.map((val) => {
                    const isOn = selected.has(val)
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          if (def.multiSelect) {
                            api.toggleValue(dim, val)
                          } else {
                            api.setFilter(dim, isOn ? [] : [val])
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition ${
                          isOn
                            ? 'bg-neon-violet/30 text-white ring-1 ring-neon-violet shadow-[0_0_10px_-2px_rgba(138,43,226,0.6)]'
                            : 'bg-ink-soft text-white/60 ring-1 ring-white/15 hover:text-white hover:ring-white/30'
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

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={api.resetToDefault}
              className="text-xs text-white/40 hover:text-white uppercase tracking-widest"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
