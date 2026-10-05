// DiceImpactFX – burst particles fired on dice landing, subscribes to DICE_ROLLED event.
import React, { useRef, useEffect, useState } from 'react';
import { Sparkles } from '@react-three/drei';
import { Vector3 } from 'three';
import { eventBus } from '../core/eventBus';

export function DiceImpactFX() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState<Vector3>(new Vector3(0, 0.5, 0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      setActive(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(false), 800);
    };
    eventBus.on('DICE_ROLLED', handler);
    return () => {
      eventBus.off('DICE_ROLLED', handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <Sparkles
      position={pos}
      count={60}
      scale={2}
      size={6}
      speed={1.5}
      opacity={0.9}
      color="#ffdd00"
    />
  );
}
