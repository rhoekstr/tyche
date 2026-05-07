import { useEffect, useMemo, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'

interface Props {
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

const SIZE = 168
const FACE_W = SIZE
const FACE_H = SIZE * 1.15
const APOTHEM = (FACE_W / 2) / Math.tan(Math.PI / 3) // distance from center to face for triangular prism (60°)
const TOTAL_ROTATION = 1440 // 4 full Y rotations + landing offset
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export default function RPSAnimation({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1300,
}: Props) {
  const completeFiredRef = useRef(false)
  const rafRef = useRef<number>(0)
  const prismRef = useRef<HTMLDivElement>(null)

  // Stable face order — assign each pool item to a face slot (mod 3).
  const faceItems = useMemo<[PackItem | null, PackItem | null, PackItem | null]>(() => {
    if (pool.length === 0) return [null, null, null]
    return [pool[0] ?? null, pool[1] ?? pool[0]!, pool[2] ?? pool[0]!]
  }, [pool])

  // Final landing offset: rotate so the face matching `result` ends up forward.
  // Faces are placed at `rotateY(-120*i) translateZ(apothem)`, so total Y for
  // face i = parent + (-120i). Camera-facing means total ≡ 0 (mod 360),
  // so parent must equal +120 * i.
  const landOffset = useMemo(() => {
    if (!result) return 0
    const idx = pool.findIndex((p) => p.value === result.value)
    if (idx < 0) return 0
    return 120 * (idx % 3)
  }, [pool, result])

  const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0)

  useEffect(() => {
    if (!isSpinning || !result) {
      const idx = pool.findIndex((p) => p.value === result?.value)
      const targetRot = idx >= 0 ? 120 * (idx % 3) : 0
      if (prismRef.current) prismRef.current.style.transform = `rotateY(${targetRot}deg)`
      setActiveFaceIdx(idx >= 0 ? idx % 3 : 0)
      return
    }
    completeFiredRef.current = false

    const start = performance.now()
    const finalRot = TOTAL_ROTATION + landOffset

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rot = easeOutCubic(t) * finalRot
      if (prismRef.current) prismRef.current.style.transform = `rotateY(${rot}deg)`

      const normalizedRot = ((rot % 360) + 360) % 360
      const facing = Math.round(normalizedRot / 120) % 3
      setActiveFaceIdx(facing)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        if (prismRef.current) prismRef.current.style.transform = `rotateY(${finalRot}deg)`
        const idx = pool.findIndex((p) => p.value === result.value)
        setActiveFaceIdx(idx >= 0 ? idx % 3 : 0)
        if (!completeFiredRef.current) {
          completeFiredRef.current = true
          onComplete()
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinId, isSpinning, result, pool, durationMs, onComplete, landOffset])

  const lit = result !== null

  return (
    <div className="flex justify-center py-4" style={{ perspective: '1000px' }}>
      <div
        ref={prismRef}
        className="relative will-change-transform"
        style={{
          width: FACE_W,
          height: FACE_H,
          transformStyle: 'preserve-3d',
          transform: 'rotateY(0deg)',
        }}
      >
        {([0, 1, 2] as const).map((i) => (
          <PrismFace
            key={i}
            item={faceItems[i]}
            angleDeg={-120 * i}
            apothem={APOTHEM}
            highlighted={lit && activeFaceIdx === i}
            dim={lit && activeFaceIdx !== i}
          />
        ))}
      </div>
    </div>
  )
}

function PrismFace({
  item,
  angleDeg,
  apothem,
  highlighted,
  dim,
}: {
  item: PackItem | null
  angleDeg: number
  apothem: number
  highlighted: boolean
  dim: boolean
}) {
  const icon = item?.icon
  const label = item?.shortLabel ?? item?.value ?? '—'
  return (
    <div
      className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${
        highlighted
          ? 'bg-gradient-to-br from-neon-acid/40 to-neon-cyan/30 ring-2 ring-neon-acid shadow-[0_0_50px_-8px_rgba(124,255,78,0.85)]'
          : dim
          ? 'bg-ink-soft/80 ring-1 ring-white/15 text-white/60'
          : 'bg-ink-veil ring-2 ring-white/20 text-white/80'
      }`}
      style={{
        transform: `rotateY(${angleDeg}deg) translateZ(${apothem}px)`,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {icon && <span className="text-6xl leading-none">{icon}</span>}
      <span className={`text-display text-sm uppercase tracking-widest ${highlighted ? 'text-neon-acid' : ''}`}>
        {label}
      </span>
    </div>
  )
}
