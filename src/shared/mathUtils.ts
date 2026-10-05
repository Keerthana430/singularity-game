// src/shared/mathUtils.ts — pure math helpers with no project dependencies

/** Linear interpolation between a and b by t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Ease-in-out cubic: smooth acceleration and deceleration. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Ease-out cubic: fast start, slow end. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Ease-in cubic: slow start, fast end. */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/** Check if a number is valid (not NaN, not Infinity). */
export function isFiniteNumber(n: number): boolean {
  return Number.isFinite(n);
}

/** Snap a potentially NaN/Infinity value to a fallback. */
export function safeNumber(n: number, fallback: number = 0): number {
  return isFiniteNumber(n) ? n : fallback;
}
