import type { AnimationMode } from '@/types/pack'

const MODES: { mode: AnimationMode; emoji: string; label: string }[] = [
  { mode: 'slot', emoji: '🎰', label: 'Slot' },
  { mode: 'coin', emoji: '🪙', label: 'Coin' },
  { mode: 'dice', emoji: '🎲', label: 'Dice' },
  { mode: 'card', emoji: '🃏', label: 'Card' },
  { mode: 'rps', emoji: '✊', label: 'RPS' },
]

interface Props {
  value: AnimationMode
  onChange: (mode: AnimationMode) => void
}

export default function AnimationPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 justify-center">
      {MODES.map(({ mode, emoji, label }) => (
        <button
          key={mode}
          type="button"
          title={label}
          onClick={() => onChange(mode)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition ${
            value === mode
              ? 'bg-neon-violet/30 text-neon-magenta ring-1 ring-neon-violet/60 shadow-[0_0_14px_-2px_rgba(138,43,226,0.6)]'
              : 'bg-ink-veil text-white/60 hover:text-white hover:bg-ink-soft ring-1 ring-white/10'
          }`}
        >
          <span>{emoji}</span>
          <span className="hidden sm:inline uppercase tracking-widest text-xs">{label}</span>
        </button>
      ))}
    </div>
  )
}
