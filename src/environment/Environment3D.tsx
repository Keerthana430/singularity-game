import React from 'react';
import { Grid, Sparkles } from '@react-three/drei';
import { PerformanceConfig } from '../rendering/qualityConfig';

interface EnvironmentProps {
  config: PerformanceConfig;
}

export function Environment3D({ config }: EnvironmentProps) {
  return (
    <group>
      {/* Fog for atmospheric depth */}
      <fog attach="fog" args={['#050510', 10, 40]} />
      
      {/* Ambient and directional light */}
      <ambientLight intensity={0.4} color="#a0b0ff" />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        color="#ffffff"
        castShadow={config.shadowMapSize > 0}
        shadow-mapSize={[config.shadowMapSize, config.shadowMapSize]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
      />
      <pointLight position={[-10, 5, -10]} intensity={1.0} color="#ff00ff" distance={30} />
      <pointLight position={[10, 5, 10]} intensity={1.0} color="#00ffff" distance={30} />

      {/* Cyber/Tron-like floor grid */}
      <Grid 
        position={[0, -0.01, 0]} 
        args={[100, 100]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#303040" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#404060" 
        fadeDistance={30} 
        fadeStrength={1} 
      />

      {/* Subtle floating particles for arcade/magic vibe */}
      {config.particleCap > 0 && (
        <Sparkles 
          count={config.particleCap} 
          scale={25} 
          size={2} 
          speed={0.2} 
          opacity={0.3} 
          color="#ffffff" 
          position={[0, 5, 0]}
        />
      )}
    </group>
  );
}
