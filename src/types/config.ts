import type { AnimationMode, FilterValues } from './pack'

export interface SlotConfig {
  id: string
  packId: string
  filters?: FilterValues
  animation?: AnimationMode
}

export interface MultiSlotConfig {
  id: string
  name: string
  slots: SlotConfig[]
  createdAt: number
  updatedAt: number
}

export interface UserPreferences {
  soundEnabled: boolean
  animationSpeed: 'slow' | 'normal' | 'fast'
  reducedMotion: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  soundEnabled: true,
  animationSpeed: 'normal',
  reducedMotion: false,
}

export interface ExportBundle {
  version: string
  exportedAt: number
  preferences?: UserPreferences
  customPacks?: Array<{ id: string; pack: unknown }>
  savedConfigs?: MultiSlotConfig[]
}
