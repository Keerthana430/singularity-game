// Audio bus configuration and SFX catalogue — all tunable values live here.
// No magic numbers in logic files.

/** Four mixer buses, each with an independent volume and mute. */
export type BusName = 'master' | 'music' | 'sfx' | 'ambience' | 'ui';

export interface BusConfig {
  defaultVolume: number; // 0..1
}

export const BUS_DEFAULTS: Record<BusName, BusConfig> = {
  master:   { defaultVolume: 1.0 },
  music:    { defaultVolume: 0.55 },
  sfx:      { defaultVolume: 0.8 },
  ambience: { defaultVolume: 0.35 },
  ui:       { defaultVolume: 0.65 },
};

/** All named sound effects used by the game. */
export type SfxId =
  | 'dice_throw'
  | 'dice_bounce'
  | 'dice_settle'
  | 'footstep'
  | 'hop_land'
  | 'snake_hiss'
  | 'snake_bite'
  | 'ladder_creak'
  | 'ladder_sparkle'
  | 'fall_impact'
  | 'victory_fanfare'
  | 'ui_click'
  | 'ui_hover'
  | 'ambience_loop';

/** Which bus each SFX belongs to, and its base volume multiplier. */
export interface SfxConfig {
  bus: BusName;
  volume: number;
  /** If true, the sound loops indefinitely until stopped. */
  loop?: boolean;
  /** Max simultaneous instances before the oldest is stopped. */
  maxInstances?: number;
}

export const SFX_CONFIG: Record<SfxId, SfxConfig> = {
  dice_throw:      { bus: 'sfx',      volume: 0.9, maxInstances: 2 },
  dice_bounce:     { bus: 'sfx',      volume: 0.7, maxInstances: 4 },
  dice_settle:     { bus: 'sfx',      volume: 0.6, maxInstances: 2 },
  footstep:        { bus: 'sfx',      volume: 0.5, maxInstances: 4 },
  hop_land:        { bus: 'sfx',      volume: 0.65, maxInstances: 3 },
  snake_hiss:      { bus: 'sfx',      volume: 0.85, maxInstances: 2 },
  snake_bite:      { bus: 'sfx',      volume: 1.0,  maxInstances: 1 },
  ladder_creak:    { bus: 'sfx',      volume: 0.7,  maxInstances: 2 },
  ladder_sparkle:  { bus: 'sfx',      volume: 0.6,  maxInstances: 3 },
  fall_impact:     { bus: 'sfx',      volume: 0.9,  maxInstances: 1 },
  victory_fanfare: { bus: 'sfx',      volume: 1.0,  maxInstances: 1 },
  ui_click:        { bus: 'ui',       volume: 0.7,  maxInstances: 4 },
  ui_hover:        { bus: 'ui',       volume: 0.3,  maxInstances: 6 },
  ambience_loop:   { bus: 'ambience', volume: 0.6,  loop: true, maxInstances: 1 },
};

/** Procedurally generated audio — URLs are synthesized at runtime via AudioContext. */
export const SYNTH_SOUNDS: Partial<Record<SfxId, boolean>> = {
  dice_throw:      true,
  dice_bounce:     true,
  dice_settle:     true,
  footstep:        true,
  hop_land:        true,
  snake_hiss:      true,
  snake_bite:      true,
  ladder_creak:    true,
  ladder_sparkle:  true,
  fall_impact:     true,
  victory_fanfare: true,
  ui_click:        true,
  ui_hover:        true,
  ambience_loop:   true,
};
