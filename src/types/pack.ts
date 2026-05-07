export type AnimationMode = 'slot' | 'coin' | 'dice' | 'card' | 'rps'

export type PackSource = 'official' | 'custom'

export type ExhaustedBehavior = 'reshuffle' | 'warn' | 'block'

export interface PackHierarchy {
  level1: string
  level2: string
  level3?: string
}

export interface PackMeta {
  title: string
  description: string
  icon: string
  defaultAnimation: AnimationMode
  tags: string[]
  hierarchy: PackHierarchy
  source: PackSource
  submittedBy?: string | null
}

export interface FilterDefinition {
  label: string
  multiSelect: boolean
}

export type FilterSchema = Record<string, FilterDefinition>

export type FilterValues = Record<string, string[]>

export interface PackItem {
  value: string
  /** Optional emoji or short symbol shown on small faces (coin, dice, RPS prism). */
  icon?: string
  /** Optional short label used when `value` is too long for a face. */
  shortLabel?: string
  filters?: FilterValues
}

export interface SamplingConfig {
  replacement: boolean
  showRemaining?: boolean
  exhaustedBehavior?: ExhaustedBehavior
}

export interface Pack {
  id: string
  version: string
  meta: PackMeta
  filters?: FilterSchema
  items: PackItem[]
  sampling?: SamplingConfig
  defaultFilters?: FilterValues
}

export interface ManifestEntry {
  id: string
  path: string
  meta: PackMeta
}

export interface Manifest {
  version: string
  packs: ManifestEntry[]
}

export const DEFAULT_SAMPLING: Required<SamplingConfig> = {
  replacement: true,
  showRemaining: false,
  exhaustedBehavior: 'reshuffle',
}

export function resolveSampling(pack: Pack): Required<SamplingConfig> {
  return { ...DEFAULT_SAMPLING, ...pack.sampling }
}
