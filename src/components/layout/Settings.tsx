import { useState } from 'react'
import { Link } from 'react-router-dom'
import { storageGet, storageSet } from '@/utils/storage'
import { loadCustomPacks, deleteCustomPack } from '@/components/browser/CustomPackBuilder'
import type { UserPreferences } from '@/types/config'
import { usePreferences } from '@/hooks/usePreferences'

export default function Settings() {
  const { prefs, updatePreferences } = usePreferences()
  const [saved, setSaved] = useState(false)
  const customPacks = loadCustomPacks()

  function updatePref<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    updatePreferences({ [key]: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function exportAll() {
    const bundle = {
      version: '1.0',
      exportedAt: Date.now(),
      preferences: prefs,
      customPacks,
      savedConfigs: storageGet('multi-configs') ?? [],
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tyche-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importAll(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const bundle = JSON.parse(ev.target?.result as string)
        if (bundle.preferences) {
          updatePreferences(bundle.preferences)
        }
        if (Array.isArray(bundle.customPacks)) {
          storageSet('custom-packs', bundle.customPacks)
        }
        if (Array.isArray(bundle.savedConfigs)) {
          storageSet('multi-configs', bundle.savedConfigs)
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function clearCustomPacks() {
    if (!confirm('Delete all custom lists? This cannot be undone.')) return
    customPacks.forEach((p) => deleteCustomPack(p.id))
    window.location.reload()
  }

  return (
    <section className="mx-auto max-w-xl pt-6">
      <Link to="/" className="inline-block text-sm uppercase tracking-[0.25em] text-white/60 hover:text-white">
        ← Home
      </Link>

      <h2 className="mt-6 text-display text-3xl text-white">Settings</h2>
      {saved && <p className="mt-2 text-neon-acid text-sm">✓ Saved</p>}

      <div className="mt-8 space-y-6">
        {/* Sound */}
        <SettingRow
          label="Sound"
          description="Play audio on spin and reveal"
        >
          <Toggle
            value={prefs.soundEnabled}
            onChange={(v) => updatePref('soundEnabled', v)}
          />
        </SettingRow>

        {/* Animation speed */}
        <SettingRow label="Animation Speed" description="How fast slots spin">
          <div className="flex gap-2">
            {(['slow', 'normal', 'fast'] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => updatePref('animationSpeed', speed)}
                className={`px-3 py-1.5 rounded-xl text-xs uppercase tracking-widest transition ${
                  prefs.animationSpeed === speed
                    ? 'bg-neon-violet/30 text-neon-magenta ring-1 ring-neon-violet/50'
                    : 'bg-ink-veil text-white/60 ring-1 ring-white/15 hover:text-white'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Reduced motion */}
        <SettingRow
          label="Reduced Motion"
          description="Minimise animations (respects OS setting)"
        >
          <Toggle
            value={prefs.reducedMotion}
            onChange={(v) => updatePref('reducedMotion', v)}
          />
        </SettingRow>

        {/* Custom packs */}
        <SettingRow
          label="Your Lists"
          description={`${customPacks.length} custom list${customPacks.length !== 1 ? 's' : ''} saved`}
        >
          <div className="flex gap-3">
            <Link
              to="/custom"
              className="text-xs uppercase tracking-widest text-neon-cyan/80 hover:text-neon-cyan"
            >
              Manage
            </Link>
            {customPacks.length > 0 && (
              <button
                type="button"
                onClick={clearCustomPacks}
                className="text-xs uppercase tracking-widest text-neon-pink/60 hover:text-neon-pink"
              >
                Clear All
              </button>
            )}
          </div>
        </SettingRow>

        {/* Data */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Data</p>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={exportAll}
              className="text-sm uppercase tracking-widest text-neon-acid/80 hover:text-neon-acid"
            >
              Export All Data
            </button>
            <label className="text-sm uppercase tracking-widest text-neon-cyan/80 hover:text-neon-cyan cursor-pointer">
              Import Backup
              <input type="file" accept=".json" className="hidden" onChange={importAll} />
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/8">
      <div>
        <div className="text-white text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-white/50 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-neon-violet' : 'bg-ink-veil ring-1 ring-white/20'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
          value ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  )
}
