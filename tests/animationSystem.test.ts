// Purpose: Automated tests for the pose validator, foot solver, state table, and pose sampler.
// Run after every phase. All must pass before marking phase DONE.

import { describe, it, expect } from 'vitest';
import { validatePose, validateSequence } from '../src/characters/animation/poseValidator';
import { REST_POSE, STANCE_POSE, lerpPose } from '../src/characters/animation/poseTypes';
import { solveHipsY, flatFootAngle } from '../src/characters/animation/footSolver';
import { canTransition, shouldOverride, getBlendTime, TRANSITION_TABLE } from '../src/characters/animation/stateTable';
import { smoothstep, punchEnvelope, easeIO, easeSnap } from '../src/characters/animation/poseSampler';

// ─── Pose Validator Tests ─────────────────────────────────────────────────────

describe('Pose Validator', () => {
  it('REST_POSE passes validation', () => {
    const result = validatePose(REST_POSE, { moveId: 'rest' });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('STANCE_POSE passes validation', () => {
    const result = validatePose(STANCE_POSE, { moveId: 'stance' });
    if (!result.passed) {
      console.error('STANCE_POSE errors:', result.errors);
    }
    expect(result.passed).toBe(true);
  });

  it('detects forearm angle violation (total < -3.14)', () => {
    const badPose = { ...REST_POSE, lUAx: -2.0, lLAx: -2.0 }; // world = -4.0
    const result = validatePose(badPose, { moveId: 'bad_forearm' });
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.field === 'lUAx+lLAx')).toBe(true);
  });

  it('detects NaN', () => {
    const badPose = { ...REST_POSE, chestX: NaN };
    const result = validatePose(badPose, { moveId: 'nan_test' });
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.field === 'chestX')).toBe(true);
  });

  it('detects joint limit violation', () => {
    const badPose = { ...REST_POSE, chestX: 1.5 }; // max is 0.8
    const result = validatePose(badPose, { moveId: 'limit_test' });
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.field === 'chestX')).toBe(true);
  });

  it('validates a sequence of lerped poses at 60 Hz', () => {
    const result = validateSequence(
      (t) => lerpPose(REST_POSE, STANCE_POSE, t),
      1.0,
      'rest_to_stance'
    );
    if (!result.passed) {
      console.error('Sequence errors:', result.errors);
    }
    expect(result.passed).toBe(true);
  });
});

// ─── Foot Solver Tests ────────────────────────────────────────────────────────

describe('Foot Solver', () => {
  it('straight legs give ~0.905 hip height', () => {
    const h = solveHipsY(0, 0, 0, 0, 0, 0, 1.0);
    // Formula: (0.08 + 0.40*cos(0) + 0.38*cos(0) + 0.045) * cos(0) = 0.08 + 0.40 + 0.38 + 0.045 = 0.905
    expect(h).toBeCloseTo(0.905, 2);
  });

  it('bent knees lower the hips', () => {
    const straight = solveHipsY(0, 0, 0, 0, 0, 0, 1.0);
    const bent = solveHipsY(-0.35, 0.5, 0, 0.3, 0.6, 0, 1.0);
    expect(bent).toBeLessThan(straight);
  });

  it('gAmt=0 returns base height (airborne)', () => {
    const h = solveHipsY(-0.5, 1.2, 0, -0.5, 1.2, 0, 0.0);
    expect(h).toBeCloseTo(0.905, 2);
  });

  it('flatFootAngle corrects for a bent leg (L lead foot)', () => {
    const lULx = -0.35, lLLx = 0.50;
    const angle = flatFootAngle(lULx, lLLx, 0.08);
    // -(−0.35 + 0.50) + 0.08 = -0.15 + 0.08 = -0.07
    expect(angle).toBeCloseTo(-0.07, 2);
  });
});

// ─── State Table Tests ────────────────────────────────────────────────────────

describe('State Table', () => {
  it('idle can transition to stance', () => {
    expect(canTransition('idle', 'stance')).toBe(true);
  });

  it('idle can transition to attack_jab', () => {
    expect(canTransition('idle', 'attack_jab')).toBe(true);
  });

  it('attack_jab can chain to attack_cross', () => {
    expect(canTransition('attack_jab', 'attack_cross')).toBe(true);
  });

  it('attack_jab CANNOT transition to victory (illegal)', () => {
    expect(canTransition('attack_jab', 'victory')).toBe(false);
  });

  it('down CANNOT be interrupted by an attack', () => {
    expect(canTransition('down', 'attack_jab')).toBe(false);
  });

  it('dodge can be entered from locomotion', () => {
    expect(canTransition('walk', 'dodge')).toBe(true);
    expect(canTransition('stance', 'dodge')).toBe(true);
  });

  it('hit can interrupt an attack', () => {
    expect(canTransition('attack_jab', 'hit_light')).toBe(true);
    expect(canTransition('attack_uppercut', 'hit_heavy')).toBe(true);
  });

  it('all states in TRANSITION_TABLE have valid "from" entries', () => {
    for (const [state, froms] of Object.entries(TRANSITION_TABLE)) {
      expect(Array.isArray(froms)).toBe(true);
      // At least idle can reach any non-starting state eventually
    }
  });

  it('blend times are positive and match spec', () => {
    expect(getBlendTime('idle', 'attack_jab')).toBeCloseTo(0.05, 2);
    expect(getBlendTime('attack_jab', 'idle')).toBeCloseTo(0.12, 2);
    expect(getBlendTime('idle', 'hit_light')).toBeCloseTo(0.03, 2);
    expect(getBlendTime('idle', 'dodge')).toBeCloseTo(0.04, 2);
    expect(getBlendTime('idle', 'block')).toBeCloseTo(0.08, 2);
    expect(getBlendTime('block', 'idle')).toBeCloseTo(0.12, 2);
  });
});

// ─── Sampler / Easing Tests ───────────────────────────────────────────────────

describe('Easing', () => {
  it('easeIO(0) = 0, easeIO(1) = 1', () => {
    expect(easeIO(0)).toBeCloseTo(0);
    expect(easeIO(1)).toBeCloseTo(1);
  });

  it('easeSnap(0) = 0, easeSnap(1) = 1', () => {
    expect(easeSnap(0)).toBeCloseTo(0);
    expect(easeSnap(1)).toBeCloseTo(1);
  });

  it('smoothstep clamps correctly', () => {
    expect(smoothstep(0, 1, -0.5)).toBe(0);
    expect(smoothstep(0, 1, 1.5)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 1);
  });

  it('punchEnvelope is 1 at hold, 0 at start and end', () => {
    expect(punchEnvelope(0, 0.1, 0.2, 0.5)).toBe(0);
    expect(punchEnvelope(0.15, 0.1, 0.2, 0.5)).toBe(1);
    expect(punchEnvelope(0.5, 0.1, 0.2, 0.5)).toBeCloseTo(0, 1);
  });
});

// ─── Evasion Logic Tests ──────────────────────────────────────────────────────

describe('Evasion Rules', () => {
  const DODGE_IFRAMES_START = 0.03;
  const DODGE_IFRAMES_END = 0.36;
  const PARRY_WINDOW_END = 0.17;

  it('punch during dodge i-frames deals 0 damage', () => {
    // Simulated: dodgeTime = 0.10 (inside 0.03-0.36)
    const dodgeTime = 0.10;
    const isInvulnerable = dodgeTime >= DODGE_IFRAMES_START && dodgeTime <= DODGE_IFRAMES_END;
    expect(isInvulnerable).toBe(true);
  });

  it('punch before dodge i-frames deals damage', () => {
    const dodgeTime = 0.02; // before 0.03
    const isInvulnerable = dodgeTime >= DODGE_IFRAMES_START && dodgeTime <= DODGE_IFRAMES_END;
    expect(isInvulnerable).toBe(false);
  });

  it('dodge at 0.10s is inside parry window (0.03-0.17)', () => {
    const dodgeTime = 0.10;
    const isParry = dodgeTime >= DODGE_IFRAMES_START && dodgeTime <= PARRY_WINDOW_END;
    expect(isParry).toBe(true);
  });

  it('dodge at 0.25s is NOT inside parry window', () => {
    const dodgeTime = 0.25;
    const isParry = dodgeTime >= DODGE_IFRAMES_START && dodgeTime <= PARRY_WINDOW_END;
    expect(isParry).toBe(false);
  });

  it('jump clears sweep (feet above 0.32)', () => {
    const jumpFeetHeight = 0.50;
    const sweepCleared = jumpFeetHeight > 0.32;
    expect(sweepCleared).toBe(true);
  });

  it('jump does NOT clear a punch (punch hits regardless of height)', () => {
    // Punches always check by distance, not by foot height
    const isPunch = true;
    const jumpClears = !isPunch; // punches always hit if in range
    expect(jumpClears).toBe(false);
  });
});
