import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3, Euler, Quaternion } from 'three';

export interface Dice3DRef {
  roll: (result: number) => Promise<void>;
}

export const Dice3D = forwardRef<Dice3DRef, Record<string, unknown>>((props, ref) => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const isRolling = useRef(false);
  const targetResult = useRef<number | null>(null);

  // Expose an imperative roll method
  useImperativeHandle(ref, () => ({
    roll: async (result: number) => {
      if (!bodyRef.current) return;
      isRolling.current = true;
      targetResult.current = result;

      // Wake up physics body
      bodyRef.current.wakeUp();

      // Reset position to drop height
      bodyRef.current.setTranslation(new Vector3(0, 5, 0), true);

      // Randomize initial rotation for chaos
      const initRot = new Quaternion().setFromEuler(new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));
      bodyRef.current.setRotation(initRot, true);

      // Apply impulse and torque
      bodyRef.current.applyImpulse(new Vector3(Math.random() * 2 - 1, -5, Math.random() * 2 - 1), true);
      bodyRef.current.applyTorqueImpulse(new Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2), true);

      // We don't have true deterministic steering here yet, 
      // so we use a visual trick: let it bounce, and right before it settles, 
      // force the rotation to match the result.
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          forceResultRotation(result);
          isRolling.current = false;
          resolve();
        }, 1500); // 1.5 seconds to settle
      });
    }
  }));

  const forceResultRotation = (result: number) => {
    if (!bodyRef.current) return;
    // Map result 1-6 to exact Euler angles for the cube face
    // Assuming standard UV mapping where +Y = 1, etc.
    const eulers: Record<number, Euler> = {
      1: new Euler(0, 0, 0),
      2: new Euler(-Math.PI / 2, 0, 0),
      3: new Euler(0, 0, Math.PI / 2),
      4: new Euler(0, 0, -Math.PI / 2),
      5: new Euler(Math.PI / 2, 0, 0),
      6: new Euler(Math.PI, 0, 0),
    };

    const targetEuler = eulers[result];
    if (targetEuler) {
      bodyRef.current.setRotation(new Quaternion().setFromEuler(targetEuler), true);
      bodyRef.current.setAngvel(new Vector3(0,0,0), true); // stop spinning
      bodyRef.current.setLinvel(new Vector3(0,0,0), true); // stop moving
    }
  };

  return (
    <RigidBody
      ref={bodyRef}
      colliders="cuboid"
      restitution={0.6}
      friction={0.5}
      position={[0, 5, 0]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
        {/* We would use a texture with 1-6 here, for now it's just a white cube. */}
      </mesh>
    </RigidBody>
  );
});
Dice3D.displayName = 'Dice3D';
