import React, { useMemo } from 'react';
import { Vector3, LineCurve3 } from 'three';
import { BoardLayout } from '../board/layout';
import { TileNumber } from '../shared';

interface Ladder3DProps {
  layout: BoardLayout;
  baseTile: number;
  topTile: number;
}

export function Ladder3D({ layout, baseTile, topTile }: Ladder3DProps) {
  const getPos = (n: number) => {
    const t = layout.tiles[n as TileNumber];
    if (!t) return new Vector3(0, 0, 0);
    return new Vector3(t.center.x, t.surfaceHeight, t.center.z);
  };

  const startPos = getPos(baseTile);
  const endPos = getPos(topTile);

  // Simple ladder: two main poles and steps
  const stepsCount = Math.floor(startPos.distanceTo(endPos) / 0.5);
  
  const dir = new Vector3().subVectors(endPos, startPos).normalize();
  const up = new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(0.2); // half width

  const leftPoleStart = startPos.clone().sub(right).setY(startPos.y + 0.1);
  const leftPoleEnd = endPos.clone().sub(right).setY(endPos.y + 0.1);
  const rightPoleStart = startPos.clone().add(right).setY(startPos.y + 0.1);
  const rightPoleEnd = endPos.clone().add(right).setY(endPos.y + 0.1);

  const leftCurve = useMemo(() => new LineCurve3(leftPoleStart, leftPoleEnd), [leftPoleStart, leftPoleEnd]);
  const rightCurve = useMemo(() => new LineCurve3(rightPoleStart, rightPoleEnd), [rightPoleStart, rightPoleEnd]);

  // Shared neon ladder material props
  const poleProps = { color: '#001122', roughness: 0.1, metalness: 0.9, emissive: '#00eeff', emissiveIntensity: 1.5 };
  const stepProps = { color: '#001122', roughness: 0.1, metalness: 0.9, emissive: '#00ccdd', emissiveIntensity: 0.8 };

  return (
    <group>
      {/* Left pole */}
      <mesh castShadow>
        <tubeGeometry args={[leftCurve, 6, 0.06, 6, false]} />
        <meshStandardMaterial {...poleProps} />
      </mesh>
      {/* Right pole */}
      <mesh castShadow>
        <tubeGeometry args={[rightCurve, 6, 0.06, 6, false]} />
        <meshStandardMaterial {...poleProps} />
      </mesh>
      {/* Steps – each step is a separate mesh for correct geometry */}
      {Array.from({ length: stepsCount }, (_, i) => {
        const t = (i + 1) / (stepsCount + 1);
        const stepLeft = leftPoleStart.clone().lerp(leftPoleEnd, t);
        const stepRight = rightPoleStart.clone().lerp(rightPoleEnd, t);
        const sc = new LineCurve3(stepLeft, stepRight);
        return (
          <mesh key={i} castShadow>
            <tubeGeometry args={[sc, 2, 0.04, 6, false]} />
            <meshStandardMaterial {...stepProps} />
          </mesh>
        );
      })}
    </group>
  );
}
