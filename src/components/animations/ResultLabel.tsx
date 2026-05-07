import type { PackItem } from '@/types/pack'

/** Full-text result confirmation rendered below a 3D animation.
 *  Skip for slot machine (its reel already shows the value at full size). */
export default function ResultLabel({
  item,
  isSpinning,
}: {
  item: PackItem | null
  isSpinning: boolean
}) {
  if (!item || isSpinning) return null
  return (
    <p className="mt-4 text-display text-xl md:text-2xl text-white text-center px-3 leading-tight">
      {item.icon && <span className="mr-2">{item.icon}</span>}
      {item.value}
    </p>
  )
}
