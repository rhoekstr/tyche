import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DesktopUtilityNav, MobileUtilityBar } from './UtilityStrip'

export default function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-6 pt-6 pb-2 flex items-center gap-4">
        <Link to="/" className="hover:opacity-80 transition inline-block">
          <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-neon-magenta via-neon-violet to-neon-cobalt bg-clip-text text-transparent">
            So Random!
          </h1>
        </Link>
        <div className="hidden md:flex items-center gap-2 ml-1">
          <NavPill to="/multi" active={pathname === '/multi'}>🎰 Multi-Slot</NavPill>
          <NavPill to="/custom" active={pathname === '/custom'}>✏️ Custom</NavPill>
          <NavPill to="/settings" active={pathname === '/settings'}>⚙️ Settings</NavPill>
        </div>
      </header>

      {/* Two-column on desktop: sidebar + main */}
      <div className="flex flex-1">
        <aside className="hidden md:flex flex-col w-44 shrink-0 px-4 py-2 border-r border-white/10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 px-4 pb-3">Utilities</p>
          <DesktopUtilityNav />
        </aside>

        <main className="flex-1 px-4 md:px-8 pb-28 md:pb-8 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile fixed bottom utility bar */}
      <div className="md:hidden">
        <MobileUtilityBar />
      </div>
    </div>
  )
}

function NavPill({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full ring-1 transition ${
        active
          ? 'bg-neon-violet/20 text-neon-magenta ring-neon-violet/50'
          : 'text-white/50 ring-white/20 hover:text-white hover:ring-white/40'
      }`}
    >
      {children}
    </Link>
  )
}
