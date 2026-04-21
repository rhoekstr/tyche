import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export const UTILITIES = [
  { path: '/utility/coin', emoji: '🪙', label: 'Coin' },
  { path: '/utility/dice', emoji: '🎲', label: 'Dice' },
  { path: '/utility/rps', emoji: '✂️', label: 'RPS' },
  { path: '/utility/card', emoji: '🃏', label: 'Cards' },
] as const

/** Desktop sidebar nav — shown only on md+ */
export function DesktopUtilityNav() {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Utilities" className="flex flex-col gap-1">
      {UTILITIES.map(({ path, emoji, label }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${
            pathname === path
              ? 'bg-neon-violet/20 text-neon-magenta ring-1 ring-neon-violet/40'
              : 'text-white/70 hover:text-white hover:bg-ink-veil'
          }`}
        >
          <span className="text-xl">{emoji}</span>
          <span className="uppercase tracking-widest">{label}</span>
        </Link>
      ))}
    </nav>
  )
}

/** Mobile fixed bottom bar — shown only below md */
export function MobileUtilityBar() {
  const { pathname } = useLocation()
  const isFullScreen =
    pathname.startsWith('/pack/') || pathname.startsWith('/utility/')
  const [expanded, setExpanded] = useState(false)

  if (isFullScreen && !expanded) {
    return (
      <div className="fixed bottom-4 inset-x-0 flex justify-center z-50 pointer-events-none">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2 rounded-full bg-ink-veil/90 ring-1 ring-white/20 text-white/60 text-xs uppercase tracking-widest backdrop-blur-md shadow-lg"
        >
          <span>Utilities</span>
          <span>↑</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-ink/90 backdrop-blur-md border-t border-white/10">
      <div className="flex justify-around items-center px-2 py-3 pb-safe">
        {UTILITIES.map(({ path, emoji, label }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setExpanded(false)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
              pathname === path ? 'text-neon-magenta' : 'text-white/70 active:text-white'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs uppercase tracking-widest">{label}</span>
          </Link>
        ))}
        {isFullScreen && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex flex-col items-center gap-1 px-3 py-1 text-white/40 active:text-white"
          >
            <span className="text-xl">↓</span>
            <span className="text-xs uppercase tracking-widest">Hide</span>
          </button>
        )}
      </div>
    </div>
  )
}
