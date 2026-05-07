import type { FilterSchema, FilterValues, Pack, PackItem } from '@/types/pack'

export function filterItems(
  items: PackItem[],
  schema: FilterSchema | undefined,
  active: FilterValues | undefined,
): PackItem[] {
  if (!schema || !active) return items
  // Only dimensions that are both in the schema AND have at least one
  // selected value participate in filtering. Empty arrays (or missing
  // keys) mean "no filter on this dim — accept anything".
  const dimensions = Object.keys(active).filter(
    (key) => schema[key] && (active[key]?.length ?? 0) > 0,
  )
  if (dimensions.length === 0) return items

  return items.filter((item) =>
    dimensions.every((dim) => {
      const selected = active[dim]!
      const itemValues = item.filters?.[dim]
      if (!itemValues || itemValues.length === 0) return false
      return itemValues.some((v) => selected.includes(v))
    }),
  )
}

export function pickRandom<T>(pool: T[], rng: () => number = Math.random): T {
  if (pool.length === 0) throw new Error('Cannot pick from empty pool')
  return pool[Math.floor(rng() * pool.length)]!
}

export function shuffle<T>(pool: T[], rng: () => number = Math.random): T[] {
  const out = [...pool]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export interface DrawState {
  remaining: PackItem[]
  drawn: PackItem[]
}

export function initDrawState(pool: PackItem[], rng?: () => number): DrawState {
  return { remaining: shuffle(pool, rng), drawn: [] }
}

export interface DrawResult {
  item: PackItem
  state: DrawState
  poolExhausted: boolean
}

export function drawWithReplacement(
  pool: PackItem[],
  rng: () => number = Math.random,
): PackItem {
  return pickRandom(pool, rng)
}

export function drawWithoutReplacement(
  state: DrawState,
  pool: PackItem[],
  rng: () => number = Math.random,
): DrawResult {
  let working = state
  if (working.remaining.length === 0) {
    working = initDrawState(pool, rng)
  }
  const [item, ...rest] = working.remaining
  const nextState: DrawState = {
    remaining: rest,
    drawn: [...working.drawn, item!],
  }
  return { item: item!, state: nextState, poolExhausted: rest.length === 0 }
}

export function reconcileDrawState(
  state: DrawState,
  pool: PackItem[],
): DrawState {
  const poolSet = new Set(pool.map((i) => i.value))
  const remaining = state.remaining.filter((i) => poolSet.has(i.value))
  const drawn = state.drawn.filter((i) => poolSet.has(i.value))
  const drawnSet = new Set(drawn.map((i) => i.value))
  const remainingSet = new Set(remaining.map((i) => i.value))
  const missing = pool.filter(
    (i) => !drawnSet.has(i.value) && !remainingSet.has(i.value),
  )
  return { remaining: [...remaining, ...missing], drawn }
}

export function defaultActiveFilters(pack: Pack): FilterValues {
  // Default: no filter on any dimension. The user opts in by selecting
  // chips. Empty / missing dim entries are treated as "accept anything"
  // by filterItems.
  if (!pack.filters) return {}
  return {}
}
