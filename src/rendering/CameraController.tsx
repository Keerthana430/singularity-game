import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import gsap from 'gsap';

interface CameraControllerProps {
  targetPosition?: Vector3; // Position of the current player to follow
}

export function CameraController({ targetPosition }: CameraControllerProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (targetPosition) {
      // Smoothly interpolate current target to the real target
      currentTarget.current.lerp(targetPosition, delta * 5);
    }

    // Offset camera: elevate and pull back (3/4 view)
    const offset = new Vector3(0, 8, 8);
    const desiredPos = currentTarget.current.clone().add(offset);
    
    // Lerp camera position to desired offset
    camera.position.lerp(desiredPos, delta * 5);
    
    // Look at target
    camera.lookAt(currentTarget.current);
  });

  return null; // Component just manages camera
}
