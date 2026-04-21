import { useEffect, useRef } from 'react'

interface Props {
  trigger: number   // increment to fire a burst
  count?: number
}

const COLORS = [
  '#ff2bd6', '#8a2be2', '#7cff4e', '#ff7a1a',
  '#2f5bff', '#32e6ff', '#fff04e', '#ff4fa3',
]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  size: number
  angle: number
  spin: number
}

export default function ParticleBurst({ trigger, count = 24 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2

    particlesRef.current = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 6
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        size: 4 + Math.random() * 6,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
      }
    })

    cancelAnimationFrame(animRef.current)

    function tick() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const alive = particlesRef.current.filter((p) => p.alpha > 0.01)
      for (const p of alive) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.18   // gravity
        p.alpha -= 0.018
        p.angle += p.spin

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      particlesRef.current = alive
      if (alive.length > 0) animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [trigger, count])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
