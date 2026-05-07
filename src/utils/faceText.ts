import type { PackItem } from '@/types/pack'

interface FaceLabelOptions {
  /** Length above which we fall back to shortLabel/icon-only. */
  maxChars: number
  /** Font sizes for [short, medium, long] text within the maxChars budget. */
  sizes: [string, string, string]
}

/** Decide what text to render on a small face (coin/dice/prism), and at what size.
 *  Prefers `shortLabel` over `value` when present. If text is still too long
 *  AND the item has an `icon`, returns no text (icon will carry the face). */
export function faceLabel(
  item: PackItem | null,
  { maxChars, sizes }: FaceLabelOptions,
): { text: string; fontSize: string } {
  if (!item) return { text: '?', fontSize: sizes[0] }
  const candidate = item.shortLabel ?? item.value
  if (candidate.length > maxChars && item.icon) {
    return { text: '', fontSize: sizes[2] }
  }
  const len = candidate.length
  const fontSize =
    len > maxChars ? sizes[2] : len > Math.floor(maxChars * 0.6) ? sizes[1] : sizes[0]
  return { text: candidate, fontSize }
}
