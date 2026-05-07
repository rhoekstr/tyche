import { useCallback, useRef } from 'react'
import { usePreferences } from './usePreferences'

/** Lazy-initialised AudioContext shared across the app. Created on first
 *  user-gesture-triggered play(), per browser autoplay policy. */
let sharedCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    sharedCtx = new Ctor()
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume()
  }
  return sharedCtx
}

interface ToneSpec {
  /** Frequency in Hz (or sequence of frequencies) */
  freq: number | number[]
  /** Total duration in seconds */
  duration: number
  /** Oscillator type */
  type?: OscillatorType
  /** Peak gain (0..1) */
  gain?: number
}

function playTone(spec: ToneSpec): void {
  const ctx = getContext()
  if (!ctx) return

  const now = ctx.currentTime
  const freqs = Array.isArray(spec.freq) ? spec.freq : [spec.freq]
  const peak = spec.gain ?? 0.12
  const dur = spec.duration

  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  // Fast attack, exponential decay for a clean blip
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

  for (const f of freqs) {
    const osc = ctx.createOscillator()
    osc.type = spec.type ?? 'sine'
    osc.frequency.setValueAtTime(f, now)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + dur)
  }
}

export function useSound() {
  const { prefs } = usePreferences()
  const enabledRef = useRef(prefs.soundEnabled)
  enabledRef.current = prefs.soundEnabled

  /** Tick during a spin — short, snappy. */
  const playTick = useCallback(() => {
    if (!enabledRef.current) return
    playTone({ freq: 880, duration: 0.04, type: 'square', gain: 0.04 })
  }, [])

  /** Spin start — short rising swoop. */
  const playSpin = useCallback(() => {
    if (!enabledRef.current) return
    playTone({ freq: 320, duration: 0.18, type: 'sawtooth', gain: 0.08 })
  }, [])

  /** Result reveal — major-third chord. */
  const playLand = useCallback(() => {
    if (!enabledRef.current) return
    playTone({ freq: [523.25, 659.25, 783.99], duration: 0.6, type: 'sine', gain: 0.1 })
  }, [])

  return { playSpin, playLand, playTick, enabled: prefs.soundEnabled }
}
