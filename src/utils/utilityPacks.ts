import type { Pack, PackItem } from '@/types/pack'
import { registerPack } from '@/hooks/usePacks'

const SUITS = ['♠', '♥', '♦', '♣'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

const DECK: PackItem[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ value: rank, icon: suit, shortLabel: `${rank}${suit}` })),
)

const UTILITY_PACKS: Pack[] = [
  {
    id: '_utility:coin',
    version: '1.0',
    meta: {
      title: 'Coin',
      description: 'Heads or tails.',
      icon: '🪙',
      defaultAnimation: 'coin',
      tags: ['utility', 'coin'],
      hierarchy: { level1: 'Utilities', level2: 'Coin' },
      source: 'official',
      submittedBy: null,
    },
    items: [
      { value: 'HEADS', icon: '👑' },
      { value: 'TAILS', icon: '🦅' },
    ],
    sampling: { replacement: true },
  },
  {
    id: '_utility:dice',
    version: '1.0',
    meta: {
      title: 'Dice (d6)',
      description: 'A standard six-sided die.',
      icon: '🎲',
      defaultAnimation: 'dice',
      tags: ['utility', 'dice'],
      hierarchy: { level1: 'Utilities', level2: 'Dice' },
      source: 'official',
      submittedBy: null,
    },
    items: Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1) })),
    sampling: { replacement: true },
  },
  {
    id: '_utility:cards',
    version: '1.0',
    meta: {
      title: 'Cards',
      description: 'Draw from a 52-card deck.',
      icon: '🃏',
      defaultAnimation: 'card',
      tags: ['utility', 'cards'],
      hierarchy: { level1: 'Utilities', level2: 'Cards' },
      source: 'official',
      submittedBy: null,
    },
    items: DECK,
    sampling: { replacement: true },
  },
  {
    id: '_utility:rps',
    version: '1.0',
    meta: {
      title: 'Rock · Paper · Scissors',
      description: 'Pick a throw.',
      icon: '✊',
      defaultAnimation: 'rps',
      tags: ['utility', 'rps'],
      hierarchy: { level1: 'Utilities', level2: 'RPS' },
      source: 'official',
      submittedBy: null,
    },
    items: [
      { value: 'Rock', icon: '🪨' },
      { value: 'Paper', icon: '📄' },
      { value: 'Scissors', icon: '✂️' },
    ],
    sampling: { replacement: true },
  },
]

let registered = false

/** Register all utility packs with the pack cache so usePack(id) works for them. */
export function ensureUtilityPacksRegistered(): void {
  if (registered) return
  registered = true
  for (const pack of UTILITY_PACKS) registerPack(pack)
}

/** Manifest-style entries for utility packs, suitable for slot pickers. */
export const UTILITY_PACK_OPTIONS = UTILITY_PACKS.map((p) => ({
  id: p.id,
  label: p.meta.title,
  icon: p.meta.icon,
}))

export const UTILITY_PACK_IDS = new Set(UTILITY_PACKS.map((p) => p.id))
