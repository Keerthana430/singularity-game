import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/store';
import { Board3D } from '../board';
import { PlayerPawn3D, Dice3D, Dice3DRef, CameraController } from './';
import { eventBus } from '../core/eventBus';
import { GameEvent } from '../state/eventTypes';
import { getTilePosition } from '../board/tileMapping';
import { Vector3 } from 'three';
import { animatePath } from '../movement/pathAnimator';

export function GameRenderer() {
  const boardConfig = useGameStore(state => state.boardConfig);
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  
  const diceRef = useRef<Dice3DRef>(null);
  
  // We manage visual positions in local state, derived from events, 
  // to allow smooth animation without snapping immediately when the pure state updates.
  const [visualPositions, setVisualPositions] = useState<Record<string, Vector3>>({});
  
  // Pawn refs for animation
  const pawnRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    // Initialize visual positions if not set
    const initialPos: Record<string, Vector3> = {};
    players.forEach(p => {
      if (!visualPositions[p.id]) {
        initialPos[p.id] = getTilePosition(p.position, boardConfig.size, 10, 1);
      }
    });
    if (Object.keys(initialPos).length > 0) {
      setVisualPositions(prev => ({ ...prev, ...initialPos }));
    }
  }, [players, boardConfig.size]);

  useEffect(() => {
    // Integration layer: Listen to domain events to trigger animations
    
    const onDiceRolled = async (e: GameEvent) => {
      if (e.type !== 'DICE_ROLLED') return;
      if (diceRef.current) {
        await diceRef.current.roll(e.value);
      }
    };

    const onPlayerMoveStart = async (e: GameEvent) => {
      if (e.type !== 'PLAYER_MOVE_START') return;
      
      const { playerId, from, to } = e;
      const path: Vector3[] = [];
      // Build path tile by tile
      for (let i = from + 1; i <= to; i++) {
        path.push(getTilePosition(i, boardConfig.size, 10, 1));
      }
      
      const mesh = pawnRefs.current[playerId];
      if (mesh) {
        await animatePath(mesh, path);
        setVisualPositions(prev => ({ ...prev, [playerId]: path[path.length - 1] }));
      }
    };

    const onLandedOnSnake = async (e: GameEvent) => {
      if (e.type !== 'LANDED_ON_SNAKE') return;
      // Wait a tiny bit for the normal move to finish visually if needed, 
      // or just assume it's queued. For prototype, we just animate the slide.
      const mesh = pawnRefs.current[e.playerId];
      const tailPos = getTilePosition(e.to, boardConfig.size, 10, 1);
      if (mesh) {
        await animatePath(mesh, [tailPos], 1.0); // 1 sec slide
        setVisualPositions(prev => ({ ...prev, [e.playerId]: tailPos }));
      }
    };

    const onLandedOnLadder = async (e: GameEvent) => {
      if (e.type !== 'LANDED_ON_LADDER') return;
      const mesh = pawnRefs.current[e.playerId];
      const topPos = getTilePosition(e.to, boardConfig.size, 10, 1);
      if (mesh) {
        await animatePath(mesh, [topPos], 1.0); // 1 sec climb
        setVisualPositions(prev => ({ ...prev, [e.playerId]: topPos }));
      }
    };

    eventBus.on('DICE_ROLLED', onDiceRolled);
    eventBus.on('PLAYER_MOVE_START', onPlayerMoveStart);
    eventBus.on('LANDED_ON_SNAKE', onLandedOnSnake);
    eventBus.on('LANDED_ON_LADDER', onLandedOnLadder);

    return () => {
      eventBus.off('DICE_ROLLED', onDiceRolled);
      eventBus.off('PLAYER_MOVE_START', onPlayerMoveStart);
      eventBus.off('LANDED_ON_SNAKE', onLandedOnSnake);
      eventBus.off('LANDED_ON_LADDER', onLandedOnLadder);
    };
  }, [boardConfig.size]);

  const activePlayer = players[currentPlayerIndex];
  const targetCameraPos = activePlayer ? (visualPositions[activePlayer.id] || getTilePosition(1)) : undefined;

  return (
    <group>
      <Board3D config={boardConfig} />
      
      {players.map((p) => {
        const pos = visualPositions[p.id] || getTilePosition(p.position);
        return (
          // We wrap PlayerPawn3D or just render the mesh directly so we can attach a ref 
          // for gsap to animate.
          <mesh 
            key={p.id} 
            ref={el => pawnRefs.current[p.id] = el}
            position={pos} 
            castShadow
          >
            <cylinderGeometry args={[0.2, 0.4, 1.0, 16]} />
            <meshStandardMaterial color={p.color} roughness={0.3} metalness={0.1} />
          </mesh>
        );
      })}

      <Dice3D ref={diceRef} />
      <CameraController targetPosition={targetCameraPos} />
    </group>
  );
}
