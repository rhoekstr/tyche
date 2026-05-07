import { useEffect, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'
import { shuffle } from '@/utils/randomize'

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
const APOTHEM = (FACE_W / 2) / Math.tan(Math.PI / 3)
const TOTAL_ROTATION = 1440
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

type FaceTriple = [PackItem | null, PackItem | null, PackItem | null]

function pickInitialFaces(pool: PackItem[], result: PackItem, resultSlot: number): FaceTriple {
  const others = shuffle(pool.filter((p) => p.value !== result.value))
  const faces: (PackItem | null)[] = [null, null, null]
  // Hide result from the user at the start by putting some other item on the
  // result slot. (Falls back to result itself if pool is too small.)
  faces[resultSlot] = others[0] ?? result
  let oi = 1
  for (let i = 0; i < 3; i++) {
    if (i === resultSlot) continue
    faces[i] = others[oi] ?? result
    oi++
  }
  return faces as FaceTriple
}

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

  const [faceItems, setFaceItems] = useState<FaceTriple>(() =>
    [pool[0] ?? null, pool[1] ?? null, pool[2] ?? null] as FaceTriple,
  )
  const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0)

  useEffect(() => {
    if (!isSpinning) {
      // Idle: if no result yet, show first 3 pool items as a preview;
      // otherwise leave the cube exactly where the last spin landed it.
      if (!result) {
        setFaceItems([pool[0] ?? null, pool[1] ?? null, pool[2] ?? null] as FaceTriple)
        if (prismRef.current) prismRef.current.style.transform = 'rotateY(0deg)'
        setActiveFaceIdx(0)
      }
      return
    }
    if (!result) return
    completeFiredRef.current = false

    const resultSlot = Math.floor(Math.random() * 3)
    const initial = pickInitialFaces(pool, result, resultSlot)
    setFaceItems(initial)

    const finalRot = TOTAL_ROTATION + 120 * resultSlot
    const start = performance.now()
    let resultLockedIn = false

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rot = easeOutCubic(t) * finalRot
      if (prismRef.current) prismRef.current.style.transform = `rotateY(${rot}deg)`

      // Result-face world-Z normal: cos((rot - 120*resultSlot) deg). When that
      // goes < ~0 the result face is back-facing — invisible — so we can swap
      // its content to the actual result without the user noticing.
      if (!resultLockedIn) {
        const angle = ((rot - 120 * resultSlot) * Math.PI) / 180
        if (Math.cos(angle) < -0.3) {
          setFaceItems((prev) => {
            const next = [...prev] as FaceTriple
            next[resultSlot] = result
            return next
          })
          resultLockedIn = true
        }
      }

      const normalizedRot = ((rot % 360) + 360) % 360
      const facing = Math.round(normalizedRot / 120) % 3
      setActiveFaceIdx(facing)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        // Defensive: ensure the resting slot has the result, in case the
        // rotation never crossed the hidden threshold (shouldn't happen at
        // 4 full turns but cheap insurance).
        setFaceItems((prev) => {
          const next = [...prev] as FaceTriple
          next[resultSlot] = result
          return next
        })
        if (prismRef.current) prismRef.current.style.transform = `rotateY(${finalRot}deg)`
        setActiveFaceIdx(resultSlot)
        if (!completeFiredRef.current) {
          completeFiredRef.current = true
          onComplete()
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [spinId, isSpinning, result, pool, durationMs, onComplete])

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
