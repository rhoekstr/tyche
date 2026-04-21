import { describe, it, expect } from 'vitest'
import {
  drawWithReplacement,
  drawWithoutReplacement,
  filterItems,
  initDrawState,
  reconcileDrawState,
  shuffle,
  defaultActiveFilters,
} from './randomize'
import type { FilterSchema, Pack, PackItem } from '@/types/pack'

function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const items: PackItem[] = [
  { value: 'Pizza', filters: { region: ['Europe'], spice: ['Mild'] } },
  { value: 'Ramen', filters: { region: ['Asia'], spice: ['Medium'] } },
  { value: 'Curry', filters: { region: ['Asia'], spice: ['Hot'] } },
  { value: 'Taco', filters: { region: ['Americas'], spice: ['Hot'] } },
]

const schema: FilterSchema = {
  region: { label: 'Region', multiSelect: true },
  spice: { label: 'Spice', multiSelect: true },
}

describe('filterItems', () => {
  it('returns all items when schema or active are missing', () => {
    expect(filterItems(items, undefined, undefined)).toEqual(items)
    expect(filterItems(items, schema, undefined)).toEqual(items)
  })

  it('returns items matching any of the selected values per dimension', () => {
    const out = filterItems(items, schema, { region: ['Asia'] })
    expect(out.map((i) => i.value)).toEqual(['Ramen', 'Curry'])
  })

  it('AND-combines dimensions, OR-combines values within a dimension', () => {
    const out = filterItems(items, schema, {
      region: ['Asia', 'Americas'],
      spice: ['Hot'],
    })
    expect(out.map((i) => i.value)).toEqual(['Curry', 'Taco'])
  })

  it('returns empty pool when a dimension has no selected values', () => {
    expect(filterItems(items, schema, { region: [] })).toEqual([])
  })
})

describe('drawWithReplacement', () => {
  it('draws items from the pool deterministically with a seeded RNG', () => {
    const rng = seededRng(42)
    const picks = Array.from({ length: 5 }, () => drawWithReplacement(items, rng))
    for (const p of picks) expect(items).toContain(p)
  })
})

describe('drawWithoutReplacement', () => {
  it('exhausts the pool then reshuffles', () => {
    const rng = seededRng(1)
    let state = initDrawState(items, rng)
    const drawn: string[] = []
    let exhaustedAt = -1
    for (let i = 0; i < items.length; i++) {
      const r = drawWithoutReplacement(state, items, rng)
      drawn.push(r.item.value)
      state = r.state
      if (r.poolExhausted) exhaustedAt = i
    }
    expect(exhaustedAt).toBe(items.length - 1)
    expect(new Set(drawn).size).toBe(items.length)

    const after = drawWithoutReplacement(state, items, rng)
    expect(items.map((i) => i.value)).toContain(after.item.value)
  })
})

describe('reconcileDrawState', () => {
  it('drops stale items and appends newly-available ones to remaining', () => {
    const initial = initDrawState(items.slice(0, 2))
    const expandedPool = items
    const reconciled = reconcileDrawState(initial, expandedPool)
    expect(reconciled.remaining.length + reconciled.drawn.length).toBe(
      expandedPool.length,
    )
  })

  it('drops items that are no longer in the pool', () => {
    const state = initDrawState(items)
    const shrunk = items.slice(0, 2)
    const reconciled = reconcileDrawState(state, shrunk)
    const allValues = new Set([
      ...reconciled.remaining.map((i) => i.value),
      ...reconciled.drawn.map((i) => i.value),
    ])
    expect(allValues).toEqual(new Set(shrunk.map((i) => i.value)))
  })
})

describe('defaultActiveFilters', () => {
  it('uses defaultFilters when defined', () => {
    const pack: Pack = {
      id: 'x',
      version: '1',
      meta: {
        title: 'x',
        description: '',
        icon: '',
        defaultAnimation: 'slot',
        tags: [],
        hierarchy: { level1: 'a', level2: 'b' },
        source: 'official',
      },
      filters: schema,
      defaultFilters: { region: ['Asia'] },
      items,
    }
    expect(defaultActiveFilters(pack)).toEqual({ region: ['Asia'] })
  })

  it('falls back to all distinct values per dimension when no defaultFilters', () => {
    const pack: Pack = {
      id: 'x',
      version: '1',
      meta: {
        title: 'x',
        description: '',
        icon: '',
        defaultAnimation: 'slot',
        tags: [],
        hierarchy: { level1: 'a', level2: 'b' },
        source: 'official',
      },
      filters: schema,
      items,
    }
    const out = defaultActiveFilters(pack)
    expect(new Set(out.region)).toEqual(new Set(['Europe', 'Asia', 'Americas']))
    expect(new Set(out.spice)).toEqual(new Set(['Mild', 'Medium', 'Hot']))
  })
})

describe('shuffle', () => {
  it('preserves set of items', () => {
    const rng = seededRng(7)
    const out = shuffle(items, rng)
    expect(new Set(out)).toEqual(new Set(items))
  })
})
