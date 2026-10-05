// LandingHopFX – small puff of dust/hop particles when a player lands on a tile.
import React, { useRef, useEffect, useState } from 'react';
import { Sparkles } from '@react-three/drei';
import { Vector3 } from 'three';
import { eventBus } from '../core/eventBus';
import { getTilePosition } from '../board/tileMapping';

export function LandingHopFX() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<Vector3>(new Vector3(0, 0, 0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: { tile: number }) => {
      const tilePos = getTilePosition(e.tile);
      setPos(tilePos.clone().add(new Vector3(0, 0.1, 0)));
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), 500);
    };

    // Reuse PLAYER_MOVE_START for hop puff
    eventBus.on('PLAYER_MOVE_START', handler as (e: unknown) => void);
    return () => {
      eventBus.off('PLAYER_MOVE_START', handler as (e: unknown) => void);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <Sparkles
      position={pos}
      count={20}
      scale={0.8}
      size={3}
      speed={0.8}
      opacity={0.6}
      color="#aaaaff"
    />
  );
}
