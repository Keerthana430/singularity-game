import React, { useMemo } from 'react';
import { Vector3, LineCurve3 } from 'three';

interface Ladder3DProps {
  startPos: Vector3;
  endPos: Vector3;
}

export function Ladder3D({ startPos, endPos }: Ladder3DProps) {
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

  // Generate steps
  const steps = [];
  for (let i = 1; i <= stepsCount; i++) {
    const t = i / (stepsCount + 1);
    const stepLeft = leftPoleStart.clone().lerp(leftPoleEnd, t);
    const stepRight = rightPoleStart.clone().lerp(rightPoleEnd, t);
    const stepCurve = new LineCurve3(stepLeft, stepRight);
    steps.push(<tubeGeometry key={`step-${i}`} args={[stepCurve, 2, 0.05, 6, false]} />);
  }

  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[leftCurve, 2, 0.05, 6, false]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[rightCurve, 2, 0.05, 6, false]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh castShadow>
        {steps}
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
    </group>
  );
}
