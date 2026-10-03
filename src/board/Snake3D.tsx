import React, { useMemo } from 'react';
import { Vector3, CatmullRomCurve3, TubeGeometry } from 'three';

interface Snake3DProps {
  startPos: Vector3;
  endPos: Vector3;
}

export function Snake3D({ startPos, endPos }: Snake3DProps) {
  const curve = useMemo(() => {
    const midPoint = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    // Arch the snake up a bit so it sits above the board
    midPoint.y += 1.5;
    
    // Slight horizontal curve
    const dir = new Vector3().subVectors(endPos, startPos).normalize();
    const perp = new Vector3(-dir.z, 0, dir.x).multiplyScalar(1.0);
    midPoint.add(perp);
    
    return new CatmullRomCurve3([
      startPos.clone().setY(startPos.y + 0.1),
      midPoint,
      endPos.clone().setY(endPos.y + 0.1)
    ]);
  }, [startPos, endPos]);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 20, 0.15, 8, false]} />
      <meshStandardMaterial color="#ff4444" roughness={0.4} />
    </mesh>
  );
}
