// Purpose: Frame data for every move — startup, active, recovery, damage, stun, knockback, hit-stop, shake.
// Balance changes live here. Animation code never contains these numbers.

export interface MoveData {
  startup: number;      // seconds before the move is active
  active: number;       // active window duration (seconds)
  recovery: number;     // seconds after active before can act again
  damage: number;       // HP damage
  knockback: number;    // impulse distance (units)
  stun: number;         // opponent stun duration (seconds)
  hitStop: number;      // freeze duration on hit (seconds)
  shake: number;        // camera shake magnitude (0 = none)
  lunge: number;        // root forward movement during strike (units)
  reach: number;        // hit detection range (units)
  chainFrom: number;    // seconds into move when next move can be chained
}

export const MOVES: Record<string, MoveData> = {
  // ── Light Jab (Phase 9) ───────────────────────────────────────────────────
  jab: {
    startup: 0.06,
    active: 0.07,      // 0.10 to 0.17
    recovery: 0.21,    // 0.17 to 0.38
    damage: 5,
    knockback: 0.35,
    stun: 0.30,
    hitStop: 0.05,
    shake: 0.0,
    lunge: 0.32,
    reach: 1.6,
    chainFrom: 0.20,
  },

  // ── Cross Punch (Phase 10) ────────────────────────────────────────────────
  cross: {
    startup: 0.16,
    active: 0.07,      // 0.16 to 0.23
    recovery: 0.27,    // 0.23 to 0.50
    damage: 7,
    knockback: 0.6,
    stun: 0.34,
    hitStop: 0.07,
    shake: 0.0,
    lunge: 0.40,
    reach: 1.65,
    chainFrom: 0.27,
  },

  // ── Hook (Phase 11) ───────────────────────────────────────────────────────
  hook: {
    startup: 0.20,
    active: 0.08,      // 0.20 to 0.28
    recovery: 0.30,    // 0.28 to 0.58
    damage: 9,
    knockback: 1.0,
    stun: 0.46,
    hitStop: 0.09,
    shake: 0.45,
    lunge: 0.0,
    reach: 1.45,
    chainFrom: 0.36,
  },

  // ── Uppercut (Phase 12) ───────────────────────────────────────────────────
  uppercut: {
    startup: 0.22,
    active: 0.09,      // 0.22 to 0.31
    recovery: 0.39,    // 0.31 to 0.70
    damage: 13,
    knockback: 1.15,
    stun: 0.60,
    hitStop: 0.12,
    shake: 0.6,
    lunge: 0.0,
    reach: 1.4,
    chainFrom: 0.44,
  },

  // ── Sweep Kick ────────────────────────────────────────────────────────────
  sweep: {
    startup: 0.20,
    active: 0.15,
    recovery: 0.40,
    damage: 10,
    knockback: 0.8,
    stun: 0.70,
    hitStop: 0.13,
    shake: 0.3,
    lunge: 0.2,
    reach: 1.8,
    chainFrom: 0.50,
  },

  // ── Flying Kick (Jump Attack, Phase 14) ───────────────────────────────────
  flyingKick: {
    startup: 0.06,
    active: 0.30,      // 0.06 to 0.36
    recovery: 0.14,
    damage: 8,
    knockback: 0.9,
    stun: 0.40,
    hitStop: 0.09,
    shake: 0.2,
    lunge: 0.0,
    reach: 1.7,
    chainFrom: 0.50,
  },

  // ── Dive Kick (Heavy Air Attack, Phase 14) ───────────────────────────────
  diveKick: {
    startup: 0.05,
    active: 0.45,
    recovery: 0.28,
    damage: 11,
    knockback: 0.8,
    stun: 0.60,
    hitStop: 0.12,
    shake: 0.5,
    lunge: 0.0,
    reach: 1.5,
    chainFrom: 0.60,
  },
};

// Hit-stop table (seconds): move name → freeze duration
export const HIT_STOP: Record<string, number> = {
  jab: 0.05,
  cross: 0.07,
  hook: 0.09,
  uppercut: 0.12,
  sweep: 0.13,
};
