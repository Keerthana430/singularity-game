import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { calculateCameraDesiredState, updateCameraState, CameraState } from '../src/camera/cameraLogic';
import { CameraMode } from '../src/camera/types';

describe('Camera Logic', () => {
  const aspectRatios = [
    16 / 9,     // Desktop / Landscape
    16 / 10,    // Laptop
    21 / 9,     // Ultrawide
    3 / 4,      // Tablet Portrait
    9 / 16      // Mobile Portrait
  ];

  const modes: CameraMode[] = ['gameplay', 'dice', 'movement', 'snake', 'ladder', 'victory', 'overview'];

  it('never yields NaN and avoids ground penetration across all modes and aspect ratios', () => {
    const target = new Vector3(5, 0, 5);
    const dicePos = new Vector3(0, 1, 0);

    for (const ratio of aspectRatios) {
      for (const mode of modes) {
        const state = calculateCameraDesiredState(mode, target, dicePos, ratio);
        
        // Assert no NaN
        expect(isNaN(state.position.x)).toBe(false);
        expect(isNaN(state.position.y)).toBe(false);
        expect(isNaN(state.position.z)).toBe(false);

        // Assert ground penetration (y >= 1.0)
        expect(state.position.y).toBeGreaterThanOrEqual(1.0);
      }
    }
  });

  it('adjusts framing based on aspect ratio (pulls back for portrait)', () => {
    const target = new Vector3(0, 0, 0);
    const landscape = calculateCameraDesiredState('gameplay', target, undefined, 16/9);
    const portrait = calculateCameraDesiredState('gameplay', target, undefined, 9/16);

    // Portrait z and y should be larger to fit the board vertically
    expect(portrait.position.z).toBeGreaterThan(landscape.position.z);
    expect(portrait.position.y).toBeGreaterThan(landscape.position.y);
  });

  it('updateCameraState correctly integrates towards desired state', () => {
    const currentPos = new Vector3(0, 0, 0);
    const currentTarget = new Vector3(0, 0, 0);
    
    const desiredPos = new Vector3(0, 10, 10);
    const desiredTarget = new Vector3(0, 0, 0);

    // Initial state
    expect(currentPos.y).toBe(0);

    // Update with delta
    updateCameraState(currentPos, currentTarget, desiredPos, desiredTarget, 0.5);

    // Current position should move towards desired
    expect(currentPos.y).toBeGreaterThan(0);
    expect(currentPos.y).toBeLessThanOrEqual(10);
    
    // Safety check - shouldn't penetrate ground even during movement
    // The physics sets y to min 1.0
    expect(currentPos.y).toBeGreaterThanOrEqual(1.0);
  });
  
  it('recovers from NaN state gracefully', () => {
    const currentPos = new Vector3(NaN, NaN, NaN);
    const currentTarget = new Vector3(NaN, NaN, NaN);
    
    const desiredPos = new Vector3(0, 10, 10);
    const desiredTarget = new Vector3(0, 0, 0);

    updateCameraState(currentPos, currentTarget, desiredPos, desiredTarget, 0.1);

    expect(isNaN(currentPos.x)).toBe(false);
    expect(currentPos.y).toBe(10); // Recovers to default 10
  });
});
