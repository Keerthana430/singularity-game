import { describe, it, expect } from 'vitest';
import { lerp, clamp } from '../src/shared/mathUtils';

describe('mathUtils', () => {
  describe('lerp', () => {
    it('should interpolate linearly between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(10, 20, 0.25)).toBe(12.5);
    });
  });

  describe('clamp', () => {
    it('should clamp a value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
