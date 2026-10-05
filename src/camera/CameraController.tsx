import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CameraMode } from './types';
import { calculateCameraDesiredState, updateCameraState } from './cameraLogic';
import { eventBus } from '../core/eventBus';

interface CameraControllerProps {
  targetPosition?: Vector3; // Position of the current player to follow
  dicePosition?: Vector3; // Position of the dice (optional)
}

export function CameraController({ targetPosition, dicePosition }: CameraControllerProps) {
  const { camera, viewport } = useThree();
  const [mode, setMode] = useState<CameraMode>('overview');
  
  const currentTarget = useRef(new Vector3(0, 0, 0));
  
  useEffect(() => {
    // Initial overview -> gameplay transition
    const timer = setTimeout(() => {
      setMode('gameplay');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleDice = () => setMode('dice');
    const handleMove = () => setMode('movement');
    const handleSnake = () => setMode('snake');
    const handleLadder = () => setMode('ladder');
    const handleTurnEnd = () => setMode('gameplay');
    const handleWin = () => setMode('victory');
    
    eventBus.on('DICE_ROLLED', handleDice);
    eventBus.on('PLAYER_MOVE_START', handleMove);
    eventBus.on('LANDED_ON_SNAKE', handleSnake);
    eventBus.on('LANDED_ON_LADDER', handleLadder);
    eventBus.on('TURN_ENDED', handleTurnEnd);
    eventBus.on('GAME_WON', handleWin);
    
    return () => {
      eventBus.off('DICE_ROLLED', handleDice);
      eventBus.off('PLAYER_MOVE_START', handleMove);
      eventBus.off('LANDED_ON_SNAKE', handleSnake);
      eventBus.off('LANDED_ON_LADDER', handleLadder);
      eventBus.off('TURN_ENDED', handleTurnEnd);
      eventBus.off('GAME_WON', handleWin);
    };
  }, []);

  useFrame((state, delta) => {
    const aspectRatio = viewport.aspect;
    
    // 1. Calculate desired state based on mode, targets, and aspect ratio
    const desired = calculateCameraDesiredState(
      mode, 
      targetPosition, 
      dicePosition, 
      aspectRatio
    );

    // 2. Integrate physics/smoothing towards the desired state
    updateCameraState(
      camera.position,
      currentTarget.current,
      desired.position,
      desired.target,
      delta
    );
    
    // 3. Apply to camera
    camera.lookAt(currentTarget.current);
  });

  return null;
}
