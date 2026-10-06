'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

export function FPSPlayer({ onHpChange, onAmmoChange }: { onHpChange: (hp: number) => void, onAmmoChange: (ammo: number) => void }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const { rapier, world } = useRapier();

  const gunRef = useRef<THREE.Group>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [ammo, setAmmo] = useState(30);

  // Constants
  const SPEED = 5;
  const JUMP_FORCE = 8;
  const MAX_AMMO = 30;

  // Move camera to body
  useFrame((state, dt) => {
    if (!rigidBodyRef.current) return;
    
    // Physics movement
    const keys = getKeys();
    const linvel = rigidBodyRef.current.linvel();
    
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const sideVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    forwardVector.y = 0; sideVector.y = 0;
    forwardVector.normalize(); sideVector.normalize();

    const moveDir = new THREE.Vector3();
    if (keys.forward) moveDir.add(forwardVector);
    if (keys.backward) moveDir.sub(forwardVector);
    if (keys.right) moveDir.add(sideVector);
    if (keys.left) moveDir.sub(sideVector);
    
    moveDir.normalize().multiplyScalar(SPEED * (keys.run ? 1.5 : 1));

    rigidBodyRef.current.setLinvel({ x: moveDir.x, y: linvel.y, z: moveDir.z }, true);

    // Jump
    if (keys.jump && Math.abs(linvel.y) < 0.1) {
      rigidBodyRef.current.setLinvel({ x: linvel.x, y: JUMP_FORCE, z: linvel.z }, true);
    }

    // Attach camera to physics body
    const pos = rigidBodyRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.8, pos.z);

    // Weapon sway & bob
    if (gunRef.current && !isReloading) {
      const isMoving = moveDir.lengthSq() > 0;
      const t = state.clock.getElapsedTime();
      
      const bobX = isMoving ? Math.sin(t * 8) * 0.05 : Math.sin(t * 2) * 0.01;
      const bobY = isMoving ? Math.abs(Math.sin(t * 8)) * 0.05 : Math.sin(t * 4) * 0.01;
      
      gunRef.current.position.set(0.3 + bobX, -0.3 + bobY, -0.6);
      gunRef.current.rotation.set(0, 0, 0); // Reset rotation from reload
    }
  });

  const handleShoot = () => {
    if (isReloading || ammo <= 0) return;
    
    setAmmo(prev => {
      const newAmmo = prev - 1;
      onAmmoChange(newAmmo);
      return newAmmo;
    });

    // Recoil animation
    if (gunRef.current) {
      gsap.killTweensOf(gunRef.current.position);
      gsap.killTweensOf(gunRef.current.rotation);
      
      const tl = gsap.timeline();
      tl.to(gunRef.current.position, { z: -0.4, y: -0.25, duration: 0.05, ease: "power2.out" });
      tl.to(gunRef.current.rotation, { x: 0.2, duration: 0.05, ease: "power2.out" }, 0);
      tl.to(gunRef.current.position, { z: -0.6, y: -0.3, duration: 0.2, ease: "power2.in" });
      tl.to(gunRef.current.rotation, { x: 0, duration: 0.2, ease: "power2.in" }, "-=0.2");
    }

    // Raycast shooting logic
    const rayOrigin = camera.position;
    const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const hit = world.castRay(ray, 100, true);

    if (hit && hit.collider) {
      const userData = hit.collider.parent()?.userData as any;
      if (userData && userData.isEnemy && userData.takeHit) {
        userData.takeHit(25, rayDir); // 25 damage per shot
      }
    }
  };

  const handleReload = () => {
    if (isReloading || ammo === MAX_AMMO) return;
    setIsReloading(true);
    
    if (gunRef.current) {
      const tl = gsap.timeline({ 
        onComplete: () => {
          setAmmo(MAX_AMMO);
          onAmmoChange(MAX_AMMO);
          setIsReloading(false);
        }
      });
      // Drop gun off screen
      tl.to(gunRef.current.position, { y: -1, z: -0.3, duration: 0.3, ease: "power2.in" });
      tl.to(gunRef.current.rotation, { x: -Math.PI / 4, duration: 0.3, ease: "power2.in" }, 0);
      // Wait (simulating clip swap)
      tl.to({}, { duration: 0.5 });
      // Bring back up
      tl.to(gunRef.current.position, { y: -0.3, z: -0.6, duration: 0.4, ease: "back.out(1.5)" });
      tl.to(gunRef.current.rotation, { x: 0, duration: 0.4, ease: "back.out(1.5)" }, "-=0.4");
    }
  };

  useEffect(() => {
    const handleMouseClick = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        handleShoot();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') handleReload();
    };

    window.addEventListener('mousedown', handleMouseClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ammo, isReloading]);

  return (
    <>
      <PointerLockControls />
      <RigidBody 
        ref={rigidBodyRef} 
        colliders={false} 
        mass={1} 
        type="dynamic" 
        position={[0, 2, 0]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
      </RigidBody>

      {/* Gun attached to Camera */}
      <group>
        <group ref={gunRef} position={[0.3, -0.3, -0.6]}>
          {/* Hands */}
          <mesh position={[-0.1, -0.1, 0.2]} castShadow>
            <boxGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="#f1c27d" />
          </mesh>
          <mesh position={[0.1, -0.1, 0.3]} castShadow>
            <boxGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="#f1c27d" />
          </mesh>
          
          {/* Assault Rifle Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.15, 0.8]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.05, -0.5]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Magazine */}
          <mesh position={[0, -0.15, 0.1]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.15]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Sight */}
          <mesh position={[0, 0.1, 0.1]} castShadow>
            <boxGeometry args={[0.05, 0.05, 0.1]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      </group>
    </>
  );
}
