// components/dungeon/fps/FirstPersonController.tsx
// Grounded FPS Movement, Pointer Lock, Physics, Head Bob, and Camera Reactions

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FPSSettings } from './types';

interface FirstPersonControllerProps {
  settings: FPSSettings;
  isPaused: boolean;
  onPositionChange?: (pos: [number, number, number], forward: [number, number, number]) => void;
  onMouseDelta?: (delta: { x: number; y: number }) => void;
  onMovementStateChange?: (moving: boolean, sprinting: boolean) => void;
  damageShakePulse?: number;
  isDead?: boolean;
}

// Global reference for raycasting and systems that need current player view direction
export const fpsPlayerCamera = {
  position: new THREE.Vector3(0, 1.35, 6),
  direction: new THREE.Vector3(0, 0, -1),
  yaw: 0,
  pitch: 0,
};

export const fpsMouseDelta = { x: 0, y: 0 };
export const fpsMovementState = { isMoving: false, isSprinting: false };

// Pillars and cover obstacle boundaries in the expanded 42x42 arena
const ARENA_COLLIDERS = [
  // 4 Inner Cover Pillars: [centerX, centerZ, radius]
  { x: -5.5, z: -4.5, r: 1.1 },
  { x: 5.5, z: -4.5, r: 1.1 },
  { x: -5.5, z: 4.5, r: 1.1 },
  { x: 5.5, z: 4.5, r: 1.1 },
  // 4 Outer Flank Pillars
  { x: -12.5, z: -10.5, r: 1.1 },
  { x: 12.5, z: -10.5, r: 1.1 },
  { x: -12.5, z: 10.5, r: 1.1 },
  { x: 12.5, z: 10.5, r: 1.1 },
  // Center Ruin Core / Terminal pedestal
  { x: 0, z: 0, r: 1.6 },
];

export function FirstPersonController({
  settings,
  isPaused,
  onPositionChange,
  onMouseDelta,
  onMovementStateChange,
  damageShakePulse = 0,
  isDead = false,
}: FirstPersonControllerProps) {
  const { camera, gl } = useThree();

  const keys = useRef<Set<string>>(new Set());
  const mouseDelta = useRef({ x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);

  // Physics state
  const pos = useRef(new THREE.Vector3(0, 1.35, 6.5));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const headBobTimer = useRef(0);
  const landingDip = useRef(0);
  const shakeTimer = useRef(0);
  const lastShakePulse = useRef(damageShakePulse);
  const lastMovingRef = useRef(false);
  const lastSprintingRef = useRef(false);

  const EYE_HEIGHT = 1.35;
  const WALK_SPEED = 6.2;
  const SPRINT_SPEED = 9.8;
  const JUMP_FORCE = 5.4;
  const GRAVITY = 18.0;

  // Pointer lock handling
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLocked.current || isPaused || isDead) return;
      const sens = settings.mouseSensitivity || 0.0022;
      const invert = settings.invertY ? -1 : 1;

      mouseDelta.current.x = e.movementX;
      mouseDelta.current.y = e.movementY;
      fpsMouseDelta.x = e.movementX;
      fpsMouseDelta.y = e.movementY;

      yaw.current -= e.movementX * sens;
      pitch.current -= e.movementY * sens * invert;
      pitch.current = THREE.MathUtils.clamp(pitch.current, -1.42, 1.42);
    };

    const handleCanvasClick = () => {
      if (!isPaused && !isDead && !isLocked.current) {
        canvas.requestPointerLock?.();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [gl, settings.mouseSensitivity, settings.invertY, isPaused, isDead, onMouseDelta]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space'].includes(e.code)) {
        keys.current.add(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };

    const clearKeys = () => keys.current.clear();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearKeys);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, []);

  // Update loop
  useFrame((_, delta) => {
    // Decay mouse delta for sway
    mouseDelta.current.x = THREE.MathUtils.lerp(mouseDelta.current.x, 0, delta * 15);
    mouseDelta.current.y = THREE.MathUtils.lerp(mouseDelta.current.y, 0, delta * 15);

    if (isDead) {
      // Death camera drop
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, 0.25, delta * 4);
      camera.position.copy(pos.current);
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0.4, delta * 3);
      return;
    }

    if (isPaused) return;

    // Trigger damage screen shake if requested
    if (damageShakePulse !== lastShakePulse.current) {
      shakeTimer.current = 0.25;
      lastShakePulse.current = damageShakePulse;
    }

    const isSprinting = keys.current.has('ShiftLeft');
    const moveZ = (keys.current.has('KeyW') ? 1 : 0) - (keys.current.has('KeyS') ? 1 : 0);
    const moveX = (keys.current.has('KeyD') ? 1 : 0) - (keys.current.has('KeyA') ? 1 : 0);
    const hasMovement = moveX !== 0 || moveZ !== 0;
    const isSprintingActive = isSprinting && hasMovement;

    fpsMovementState.isMoving = hasMovement;
    fpsMovementState.isSprinting = isSprintingActive;

    if (hasMovement !== lastMovingRef.current || isSprintingActive !== lastSprintingRef.current) {
      lastMovingRef.current = hasMovement;
      lastSprintingRef.current = isSprintingActive;
      onMovementStateChange?.(hasMovement, isSprintingActive);
    }

    // Compute forward & strafe vectors based on yaw
    const forwardX = -Math.sin(yaw.current);
    const forwardZ = -Math.cos(yaw.current);
    const rightX = Math.cos(yaw.current);
    const rightZ = -Math.sin(yaw.current);

    // Normalize input
    const inputLen = Math.hypot(moveX, moveZ) || 1;
    const normX = moveX / inputLen;
    const normZ = moveZ / inputLen;

    const currentSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED;
    const targetVx = (rightX * normX + forwardX * normZ) * currentSpeed;
    const targetVz = (rightZ * normX + forwardZ * normZ) * currentSpeed;

    // Acceleration & braking
    const accel = hasMovement ? 16 : 14;
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetVx, delta * accel);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetVz, delta * accel);

    // Jump & Gravity
    if (keys.current.has('Space') && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    if (!isGrounded.current) {
      verticalVelocity.current -= GRAVITY * delta;
      pos.current.y += verticalVelocity.current * delta;

      if (pos.current.y <= EYE_HEIGHT) {
        pos.current.y = EYE_HEIGHT;
        verticalVelocity.current = 0;
        isGrounded.current = true;
        landingDip.current = -0.12; // Landing impact dip
      }
    }

    // Recover landing dip
    landingDip.current = THREE.MathUtils.lerp(landingDip.current, 0, delta * 12);

    // Proposed new position
    let nextX = pos.current.x + velocity.current.x * delta;
    let nextZ = pos.current.z + velocity.current.z * delta;

    // Arena boundary collision [-20, 20]
    const ARENA_RADIUS = 19.8;
    nextX = THREE.MathUtils.clamp(nextX, -ARENA_RADIUS, ARENA_RADIUS);
    nextZ = THREE.MathUtils.clamp(nextZ, -ARENA_RADIUS, ARENA_RADIUS);

    // Collider obstacles (pillars)
    const PLAYER_RADIUS = 0.45;
    for (const obs of ARENA_COLLIDERS) {
      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.r + PLAYER_RADIUS;
      if (dist < minDist) {
        const pushAngle = Math.atan2(dz, dx);
        nextX = obs.x + Math.cos(pushAngle) * minDist;
        nextZ = obs.z + Math.sin(pushAngle) * minDist;
      }
    }

    pos.current.x = nextX;
    pos.current.z = nextZ;

    // Head bobbing calculation
    const horizontalSpeed = Math.hypot(velocity.current.x, velocity.current.z);
    if (isGrounded.current && horizontalSpeed > 0.5) {
      const bobFreq = isSprinting ? 14 : 9.5;
      headBobTimer.current += delta * bobFreq;
    } else {
      headBobTimer.current = THREE.MathUtils.lerp(headBobTimer.current, 0, delta * 6);
    }

    const bobY = Math.sin(headBobTimer.current) * (isSprinting ? 0.045 : 0.024);
    const bobRoll = Math.cos(headBobTimer.current * 0.5) * (isSprinting ? 0.015 : 0.008);

    // Screen Shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (shakeTimer.current > 0 && settings.screenShake) {
      shakeTimer.current -= delta;
      const intensity = shakeTimer.current * 0.06;
      shakeOffsetX = (Math.random() - 0.5) * intensity;
      shakeOffsetY = (Math.random() - 0.5) * intensity;
    }

    // Set camera position and rotation
    camera.position.set(pos.current.x, pos.current.y + bobY + landingDip.current, pos.current.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current + shakeOffsetX;
    camera.rotation.x = pitch.current + shakeOffsetY;
    camera.rotation.z = bobRoll;

    // Dynamic FOV for sprint
    const targetFov = isSprinting && horizontalSpeed > 3 ? (settings.fov || 75) + 6 : (settings.fov || 75);
    if ('fov' in camera && typeof (camera as any).fov === 'number') {
      (camera as any).fov = THREE.MathUtils.lerp((camera as any).fov, targetFov, delta * 8);
      camera.updateProjectionMatrix();
    }

    // Update global camera reference
    fpsPlayerCamera.position.copy(camera.position);
    camera.getWorldDirection(fpsPlayerCamera.direction);
    fpsPlayerCamera.yaw = yaw.current;
    fpsPlayerCamera.pitch = pitch.current;

    onPositionChange?.(
      [pos.current.x, pos.current.y, pos.current.z],
      [fpsPlayerCamera.direction.x, fpsPlayerCamera.direction.y, fpsPlayerCamera.direction.z]
    );
  });

  return null;
}
