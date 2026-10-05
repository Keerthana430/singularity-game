// VictoryFX – celebration sparkle burst on GAME_WON event.
import React, { useRef, useEffect, useState } from 'react';
import { Sparkles } from '@react-three/drei';
import { eventBus } from '../core/eventBus';

export function VictoryFX() {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      setActive(true);
      // Keep going for 4 seconds
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), 4000);
    };
    eventBus.on('GAME_WON', handler);
    return () => {
      eventBus.off('GAME_WON', handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      {/* Multi-colored victory burst */}
      <Sparkles count={200} scale={12} size={10} speed={2} opacity={0.95} color="#ffcc00" position={[0, 3, 0]} />
      <Sparkles count={80} scale={8} size={6} speed={1.5} opacity={0.8} color="#ff44ff" position={[0, 2, 0]} />
      <Sparkles count={80} scale={8} size={6} speed={1.5} opacity={0.8} color="#00ffff" position={[0, 2, 0]} />
    </>
  );
}
