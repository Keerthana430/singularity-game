// Purpose: State machine transition table from CHARACTER_ANIMATION_PLAN.md §2.2.
// One source of truth for legal state transitions. No ad-hoc if-chains elsewhere.

export type AnimState =
  | 'idle'
  | 'stance'
  | 'walk'
  | 'run'
  | 'block'
  | 'jump_crouch'
  | 'jump_rise'
  | 'jump_apex'
  | 'jump_fall'
  | 'jump_land'
  | 'attack_jab'
  | 'attack_cross'
  | 'attack_hook'
  | 'attack_uppercut'
  | 'attack_sweep'
  | 'air_attack'
  | 'dodge'
  | 'hit_light'
  | 'hit_heavy'
  | 'stagger'
  | 'launched'
  | 'tumble'
  | 'down'
  | 'get_up'
  | 'victory';

// Priority: higher index = higher priority (wins interruption)
export const STATE_PRIORITY: Record<AnimState, number> = {
  idle: 0,
  walk: 0,
  run: 0,
  stance: 0,
  block: 1,
  jump_crouch: 2,
  jump_rise: 2,
  jump_apex: 2,
  jump_fall: 2,
  jump_land: 2,
  attack_jab: 3,
  attack_cross: 3,
  attack_hook: 3,
  attack_uppercut: 3,
  attack_sweep: 3,
  air_attack: 3,
  dodge: 4,        // during i-frames, nothing can interrupt
  hit_light: 5,
  hit_heavy: 5,
  stagger: 6,
  launched: 7,
  tumble: 7,
  down: 8,
  get_up: 8,
  victory: 9,
};

// Locomotion states (can be interrupted by everything below)
const LOCOMOTION: AnimState[] = ['idle', 'stance', 'walk', 'run'];

// States that can enter block
const CAN_BLOCK_FROM: AnimState[] = [...LOCOMOTION];

// States that can enter jump
const CAN_JUMP_FROM: AnimState[] = [...LOCOMOTION];

// States that can enter attack
const CAN_ATTACK_FROM: AnimState[] = [...LOCOMOTION, 'attack_jab', 'attack_cross', 'attack_hook'];

// States that can enter dodge
const CAN_DODGE_FROM: AnimState[] = [...LOCOMOTION, 'attack_jab', 'attack_cross', 'attack_hook', 'attack_uppercut', 'attack_sweep'];

// Transition table: state -> allowed "from" states
export const TRANSITION_TABLE: Record<AnimState, AnimState[]> = {
  idle:           ['stance', 'walk', 'run', 'jump_land', 'get_up', 'block', 'hit_light', 'hit_heavy', 'stagger'],
  stance:         LOCOMOTION,
  walk:           LOCOMOTION,
  run:            LOCOMOTION,
  block:          CAN_BLOCK_FROM,
  jump_crouch:    CAN_JUMP_FROM,
  jump_rise:      ['jump_crouch'],
  jump_apex:      ['jump_rise'],
  jump_fall:      ['jump_apex', 'jump_rise'],
  jump_land:      ['jump_fall'],
  attack_jab:     CAN_ATTACK_FROM,
  attack_cross:   [...CAN_ATTACK_FROM],
  attack_hook:    [...CAN_ATTACK_FROM],
  attack_uppercut:[...LOCOMOTION, 'attack_jab', 'attack_cross', 'attack_hook'],
  attack_sweep:   [...LOCOMOTION],
  air_attack:     ['jump_rise', 'jump_apex', 'jump_fall'],
  dodge:          CAN_DODGE_FROM,
  hit_light:      [...LOCOMOTION, 'attack_jab', 'attack_cross', 'attack_hook', 'attack_uppercut', 'block', 'hit_light'],
  hit_heavy:      [...LOCOMOTION, 'attack_jab', 'attack_cross', 'attack_hook', 'attack_uppercut', 'hit_light'],
  stagger:        ['hit_heavy', 'block', ...LOCOMOTION],
  launched:       ['hit_heavy', 'hit_light', 'attack_uppercut'],
  tumble:         ['launched'],
  down:           ['launched', 'tumble'],
  get_up:         ['down'],
  victory:        LOCOMOTION,
};

/**
 * Check if a transition from `from` to `to` is legal.
 */
export function canTransition(from: AnimState, to: AnimState): boolean {
  const allowed = TRANSITION_TABLE[to];
  return allowed?.includes(from) ?? false;
}

/**
 * Check if state `to` should override state `from` by priority.
 * (Higher priority state always wins.)
 */
export function shouldOverride(from: AnimState, to: AnimState): boolean {
  return STATE_PRIORITY[to] >= STATE_PRIORITY[from];
}

/**
 * Get blend time in seconds for a given transition (from §2.5).
 */
export function getBlendTime(from: AnimState, to: AnimState): number {
  // To attack
  if (to.startsWith('attack_') || to === 'air_attack') return 0.05;
  // Attack to locomotion
  if (from.startsWith('attack_') && LOCOMOTION.includes(to)) return 0.12;
  // Attack chain
  if (from.startsWith('attack_') && to.startsWith('attack_')) return 0.05;
  // To hit
  if (to === 'hit_light' || to === 'hit_heavy') return 0.03;
  // Hit to locomotion
  if ((from === 'hit_light' || from === 'hit_heavy') && LOCOMOTION.includes(to)) return 0.12;
  // To dodge
  if (to === 'dodge') return 0.04;
  // To/from block
  if (to === 'block') return 0.08;
  if (from === 'block') return 0.12;
  // Jump crouch
  if (to === 'jump_crouch') return 0.08;
  // Land to locomotion
  if (from === 'jump_land' && LOCOMOTION.includes(to)) return 0.12;
  // To down/from down
  if (to === 'down' || to === 'launched') return 0.05;
  // Default
  return 0.10;
}
