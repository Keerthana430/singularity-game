import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../state/store';
import { Board3D } from '../board';
import { PlayerPawn3D, Dice3D, Dice3DRef } from './';
import { CameraController } from '../camera';
import { PostProcessing, DiceImpactFX, VictoryFX, LandingHopFX } from '../effects';
import { Environment3D } from '../environment';
import { eventBus } from '../core/eventBus';
import { GameEvent } from '../state/eventTypes';
import { Vector3 } from 'three';
import { animatePath } from '../movement/pathAnimator';
import { globalSequencer } from '../animation';
import { generateTerracedLayout } from '../board/layout';
import { TileNumber } from '../shared';

import { useQualityTier } from './useQualityTier';

export function GameRenderer() {
  const boardConfig = useGameStore(state => state.boardConfig);
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  
  const { config, dpr } = useQualityTier();
  const layout = useMemo(() => generateTerracedLayout(), []);

  const diceRef = useRef<Dice3DRef>(null);
  const [visualPositions, setVisualPositions] = useState<Record<string, Vector3>>({});
  const pawnRefs = useRef<Record<string, any>>({});

  const getPos = (n: number) => {
    const t = layout.tiles[n as TileNumber];
    if (!t) return new Vector3(0, 0, 0);
    return new Vector3(t.center.x, t.surfaceHeight, t.center.z);
  };

  useEffect(() => {
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
      for (let i = from + 1; i <= to; i++) {
        path.push(getPos(i));
      }
      
      const mesh = pawnRefs.current[playerId];
      if (mesh) {
        await animatePath(mesh, path);
        setVisualPositions(prev => ({ ...prev, [playerId]: path[path.length - 1] }));
      }
    };

    const onLandedOnSnake = async (e: GameEvent) => {
      if (e.type !== 'LANDED_ON_SNAKE') return;
      const mesh = pawnRefs.current[e.playerId];
      const tailPos = getPos(e.to);
      
      if (!mesh) return;

      globalSequencer.start({
        id: `snake_bite_${e.playerId}_${Date.now()}`,
        maxDuration: 5,
        canSkip: true,
        phases: [
          { name: 'detect', duration: 0.3 },
          { name: 'tension', duration: 0.5 },
          { name: 'prepare', duration: 0.3 },
          { name: 'lunge', duration: 0.2 },
          { name: 'contact', duration: 0.2 },
          { name: 'reaction', duration: 0.3 },
          { 
            name: 'descent', 
            duration: 1.0,
            onEnter: () => animatePath(mesh, [tailPos], 1.0)
          },
          { name: 'recovery', duration: 0.3 },
          { name: 'resume', duration: 0.2 }
        ]
      }, () => {
        setVisualPositions(prev => ({ ...prev, [e.playerId]: tailPos }));
        mesh.position.copy(tailPos);
      });
    };

    const onLandedOnLadder = async (e: GameEvent) => {
      if (e.type !== 'LANDED_ON_LADDER') return;
      const mesh = pawnRefs.current[e.playerId];
      const topPos = getPos(e.to);
      
      if (!mesh) return;

      globalSequencer.start({
        id: `ladder_climb_${e.playerId}_${Date.now()}`,
        maxDuration: 4,
        canSkip: true,
        phases: [
          { name: 'orient', duration: 0.2 },
          { 
            name: 'climb', 
            duration: 1.5,
            onEnter: () => animatePath(mesh, [topPos], 1.5)
          },
          { name: 'transition', duration: 0.3 }
        ]
      }, () => {
        setVisualPositions(prev => ({ ...prev, [e.playerId]: topPos }));
        mesh.position.copy(topPos);
      });
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
  }, [boardConfig.size, layout]);

  const activePlayer = players[currentPlayerIndex];
  const targetCameraPos = activePlayer ? (visualPositions[activePlayer.id] || getPos(1)) : undefined;

  useFrame((state, delta) => {
    globalSequencer.update(delta);
  });

  return (
    <group>
      <Environment3D config={config} />
      <PostProcessing config={config} />
      <DiceImpactFX />
      <VictoryFX />
      <LandingHopFX />
      <Board3D config={boardConfig} qualityConfig={config} />
      
      {players.map((p) => {
        const basePos = visualPositions[p.id] || getPos(p.position);
        
        const sharingPlayers = players.filter(other => other.position === p.position);
        const shareIndex = sharingPlayers.findIndex(other => other.id === p.id);
        const totalSharing = sharingPlayers.length;
        
        const offset = new Vector3(0, 0, 0);
        if (totalSharing > 1) {
          const angle = (shareIndex / totalSharing) * Math.PI * 2;
          const radius = 0.25;
          offset.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        }
        
        const renderPos = basePos.clone().add(offset);
        // The Pawn's visual center is bottom, so Y is shifted slightly up.
        renderPos.y += 0.5; // Offset by half the pawn height (1.0) so it stands on the surface

        return (
          <mesh 
            key={p.id} 
            ref={el => pawnRefs.current[p.id] = el}
            position={renderPos} 
            castShadow
          >
            <cylinderGeometry args={[0.2, 0.4, 1.0, 16]} />
            <meshStandardMaterial color={p.color} roughness={0.3} metalness={0.8} emissive={p.color} emissiveIntensity={0.5} />
          </mesh>
        );
      })}

      <Dice3D ref={diceRef} />
      <CameraController targetPosition={targetCameraPos} />
    </group>
  );
}
