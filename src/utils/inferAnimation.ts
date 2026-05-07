import type { AnimationMode } from '@/types/pack'

const DICE_SIDES = new Set([4, 6, 8, 10, 12, 20])

/** Pick a sensible animation for a pack with N items when no default is set. */
export function inferDefaultAnimation(itemCount: number): AnimationMode {
  if (itemCount === 2) return 'coin'
  if (DICE_SIDES.has(itemCount)) return 'dice'
  if (itemCount > 0 && itemCount <= 52) return 'card'
  return 'slot'
}
