/**
 * Mulberry32 PRNG.
 * A simple, fast, and high-quality 32-bit pseudorandom number generator.
 */
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a seeded PRNG that returns a float between [0, 1).
 */
export function createSeededRng(seed: number): () => number {
  return mulberry32(seed);
}

/**
 * Generates an integer between min and max (inclusive) using a provided RNG function.
 */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
