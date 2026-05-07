import { useEffect, useRef, useState } from 'react'
import type { PackItem } from '@/types/pack'

interface Props {
  pool: PackItem[]
  result: PackItem | null
  spinId: number
  isSpinning: boolean
  onComplete: () => void
  durationMs?: number
}

type FaceKey = 'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'
type Vec3 = [number, number, number]

const FACE_KEYS: FaceKey[] = ['front', 'back', 'right', 'left', 'top', 'bottom']

const FACE_NORMALS: Record<FaceKey, Vec3> = {
  front: [0, 0, 1],
  back: [0, 0, -1],
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, -1, 0],
  bottom: [0, 1, 0],
}

const SIZE = 160
const HALF = SIZE / 2

const FACE_TRANSFORMS: Record<FaceKey, string> = {
  front: `rotateY(0deg) translateZ(${HALF}px)`,
  back: `rotateY(180deg) translateZ(${HALF}px)`,
  right: `rotateY(90deg) translateZ(${HALF}px)`,
  left: `rotateY(-90deg) translateZ(${HALF}px)`,
  top: `rotateX(90deg) translateZ(${HALF}px)`,
  bottom: `rotateX(-90deg) translateZ(${HALF}px)`,
}

const TOTAL_X = 720
const TOTAL_Y = 1080
const FACE_UPDATE_MS = 100
const HIDDEN_THRESHOLD = -0.3

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** World-space normal of a face after parent rotation `rotateX(rx) rotateY(ry)`.
 *  CSS composes right-to-left, so apply Y rotation first, then X. */
function rotateNormal([x, y, z]: Vec3, rxDeg: number, ryDeg: number): Vec3 {
  const rx = (rxDeg * Math.PI) / 180
  const ry = (ryDeg * Math.PI) / 180
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx]
}

export default function DiceAnimation({
  pool,
  result,
  spinId,
  isSpinning,
  onComplete,
  durationMs = 1400,
}: Props) {
  const completeFiredRef = useRef(false)
  const rafRef = useRef<number>(0)
  const cubeRef = useRef<HTMLDivElement>(null)
  const [faceValues, setFaceValues] = useState<Record<FaceKey, string>>(() => ({
    front: result?.value ?? '?',
    back: '?',
    right: '?',
    left: '?',
    top: '?',
    bottom: '?',
  }))

  useEffect(() => {
    if (!isSpinning || !result) {
      setFaceValues((prev) => ({ ...prev, front: result?.value ?? '?' }))
      if (cubeRef.current) cubeRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
      return
    }
    completeFiredRef.current = false

    const pickValue = (): string =>
      pool.length > 0
        ? (pool[Math.floor(Math.random() * pool.length)]?.value ?? result.value)
        : result.value

    setFaceValues({
      front: pickValue(),
      back: pickValue(),
      right: pickValue(),
      left: pickValue(),
      top: pickValue(),
      bottom: pickValue(),
    })

    const start = performance.now()
    const lastUpdate: Record<FaceKey, number> = {
      front: 0,
      back: 0,
      right: 0,
      left: 0,
      top: 0,
      bottom: 0,
    }

    const frame = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const rx = easeOutQuart(t) * TOTAL_X
      const ry = easeOutCubic(t) * TOTAL_Y
      if (cubeRef.current) {
        cubeRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
      }

      let pendingUpdates: Partial<Record<FaceKey, string>> | null = null
      for (const key of FACE_KEYS) {
        const [, , wz] = rotateNormal(FACE_NORMALS[key], rx, ry)
        if (wz < HIDDEN_THRESHOLD && now - lastUpdate[key] >= FACE_UPDATE_MS) {
          if (!pendingUpdates) pendingUpdates = {}
          pendingUpdates[key] = pickValue()
          lastUpdate[key] = now
        }
      }
      if (pendingUpdates) {
        setFaceValues((prev) => ({ ...prev, ...pendingUpdates }))
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        setFaceValues((prev) => ({ ...prev, front: result.value }))
        if (cubeRef.current) {
          cubeRef.current.style.transform = `rotateX(${TOTAL_X}deg) rotateY(${TOTAL_Y}deg)`
        }
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
    <div className="flex justify-center py-6" style={{ perspective: '900px' }}>
      <div
        ref={cubeRef}
        className="relative will-change-transform"
        style={{
          width: SIZE,
          height: SIZE,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(0deg) rotateY(0deg)',
        }}
      >
        {FACE_KEYS.map((key) => (
          <DieFace key={key} face={key} value={faceValues[key]} lit={lit} />
        ))}
      </div>
    </div>
  )
}

function DieFace({ face, value, lit }: { face: FaceKey; value: string; lit: boolean }) {
  const fontSize = value.length > 10 ? '0.875rem' : value.length > 6 ? '1.125rem' : '1.5rem'
  return (
    <div
      className={`absolute inset-0 rounded-2xl flex items-center justify-center text-display text-center leading-tight px-3 ${
        lit
          ? 'bg-gradient-to-br from-neon-violet via-neon-cobalt to-neon-cyan text-white shadow-[0_0_60px_-8px_rgba(138,43,226,0.9)]'
          : 'bg-ink-veil ring-2 ring-white/20 text-white/40'
      }`}
      style={{
        transform: FACE_TRANSFORMS[face],
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        fontSize,
      }}
    >
      <span className="line-clamp-3">{value}</span>
    </div>
  )
}
