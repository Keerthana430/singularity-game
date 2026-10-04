'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarConfig } from '@/types/avatar';
import type { EnemyDefinition } from '@/lib/dungeonGame';
import { AvatarModel } from '@/components/avatar/AvatarModel';

export interface DungeonWorldEnemy extends EnemyDefinition {
  id: string;
  hp: number;
  position: { x: number; y: number };
  phase: number;
  stunned: number;
}

interface DungeonWorldProps {
  floor: number;
  playerConfig: AvatarConfig;
  playerPosition: { x: number; y: number };
  enemies: DungeonWorldEnemy[];
  selectedEnemy: string | null;
  attackPulse: number;
  playerHitPulse: number;
  onSelectEnemy: (id: string) => void;
}

const FLOOR_PALETTES = [
  { fog: '#07110D', floor: '#0A1711', trim: '#00FF66', danger: '#EF4444' },
  { fog: '#120A09', floor: '#1B100F', trim: '#F97316', danger: '#EF4444' },
  { fog: '#130B18', floor: '#1A0F21', trim: '#C084FC', danger: '#F43F5E' },
  { fog: '#06131A', floor: '#091A22', trim: '#22D3EE', danger: '#A855F7' },
  { fog: '#160F09', floor: '#20150A', trim: '#F59E0B', danger: '#FB7185' },
  { fog: '#170A12', floor: '#21101A', trim: '#FB7185', danger: '#F59E0B' },
];

function toWorld(point: { x: number; y: number }): [number, number, number] {
  return [(point.x - 50) * 0.075, 0, (point.y - 50) * 0.065];
}

function CameraFollow({ player, boss }: { player: [number, number, number]; boss?: [number, number, number] }) {
  const { camera } = useThree();
  const focus = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const next = boss ? new THREE.Vector3((player[0] + boss[0]) / 2, 0.65, (player[2] + boss[2]) / 2) : new THREE.Vector3(player[0], 0.65, player[2]);
    focus.current.lerp(next, Math.min(1, delta * 3.5));
    camera.position.lerp(new THREE.Vector3(focus.current.x + 4.7, 4.2, focus.current.z + 5.8), Math.min(1, delta * 3.5));
    camera.lookAt(focus.current);
  });
  return null;
}

function DungeonArchitecture({ palette, floor }: { palette: typeof FLOOR_PALETTES[number]; floor: number }) {
  const sparks = useMemo(() => Array.from({ length: 48 }, (_, index) => ({ x: ((index * 37) % 100) / 10 - 5, y: ((index * 17) % 28) / 10 + 0.5, z: ((index * 53) % 100) / 10 - 5 })), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[14, 12]} /><meshStandardMaterial color={palette.floor} roughness={0.82} metalness={0.3} /></mesh>
      <gridHelper args={[12, 24, palette.trim, '#12251B']} position={[0, 0.012, 0]} />
      <mesh position={[0, 3.2, -5.4]} receiveShadow><boxGeometry args={[13, 6.4, 0.35]} /><meshStandardMaterial color={floor >= 3 ? '#15152A' : '#111A18'} roughness={0.9} metalness={0.35} /></mesh>
      {[-5.6, 5.6].map((x) => <group key={x} position={[x, 1.5, -1.2]}><mesh castShadow><boxGeometry args={[0.28, 3, 0.55]} /><meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.38} /></mesh><mesh position={[x > 0 ? -0.18 : 0.18, 0.7, 0.3]}><boxGeometry args={[0.06, 1.6, 0.04]} /><meshStandardMaterial color={palette.trim} emissive={palette.trim} emissiveIntensity={2.4} /></mesh></group>)}
      {[-3.8, -2.2, 2.2, 3.8].map((x, index) => <group key={x} position={[x, 1.7, -4.9]} rotation={[0, 0, index % 2 ? 0.12 : -0.12]}><mesh castShadow><cylinderGeometry args={[0.11, 0.15, 3.4, 10]} /><meshStandardMaterial color="#334155" metalness={0.85} roughness={0.42} /></mesh><mesh position={[0, 0.65, 0.2]}><torusGeometry args={[0.24, 0.035, 6, 16]} /><meshStandardMaterial color={palette.trim} emissive={palette.trim} emissiveIntensity={1.4} /></mesh></group>)}
      <group position={[0, 1.2, -5.15]}><mesh><boxGeometry args={[2.4, 2.4, 0.12]} /><meshStandardMaterial color="#020502" metalness={0.7} roughness={0.32} /></mesh><mesh position={[0, 0, 0.08]}><ringGeometry args={[0.72, 0.82, 8]} /><meshBasicMaterial color={palette.trim} transparent opacity={0.75} /></mesh><pointLight color={palette.trim} intensity={3.2} distance={5} position={[0, 0, 0.5]} /></group>
      {floor >= 2 && <mesh position={[0, 0.04, 1.6]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.5, 0.035, 6, 12]} /><meshBasicMaterial color={palette.danger} transparent opacity={0.44} /></mesh>}
      {sparks.map((spark, index) => <mesh key={index} position={[spark.x, spark.y, spark.z]}><sphereGeometry args={[0.025, 6, 6]} /><meshBasicMaterial color={palette.trim} transparent opacity={0.5} /></mesh>)}
    </group>
  );
}

function PlayerCharacter({ config, position, attackPulse, hitPulse }: { config: AvatarConfig; position: [number, number, number]; attackPulse: number; hitPulse: number }) {
  const ref = useRef<THREE.Group>(null);
  const lastAttack = useRef(attackPulse);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (lastAttack.current !== attackPulse) { ref.current.rotation.z = -0.22; lastAttack.current = attackPulse; }
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, hitPulse % 2 ? -0.12 : 0, delta * 7);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0.02 + Math.sin(performance.now() * 0.002) * 0.025, delta * 5);
  });
  return <group ref={ref} position={position} scale={0.88}><AvatarModel config={config} action={attackPulse > 0 ? 'attack' : 'idle'} animate /></group>;
}

function EnemyCharacter({ enemy, selected, onSelect, palette }: { enemy: DungeonWorldEnemy; selected: boolean; onSelect: () => void; palette: typeof FLOOR_PALETTES[number] }) {
  const ref = useRef<THREE.Group>(null);
  const world = toWorld(enemy.position);
  const size = enemy.archetype === 'boss' ? 0.9 : enemy.archetype === 'tank' ? 0.58 : enemy.archetype === 'swarm' ? 0.32 : 0.46;
  useFrame(({ clock }, delta) => { if (!ref.current) return; ref.current.position.y = size + Math.sin(clock.getElapsedTime() * (enemy.archetype === 'swarm' ? 5 : 2) + enemy.position.x) * 0.06; ref.current.rotation.y += delta * (enemy.archetype === 'assassin' ? 2.2 : 0.45); });
  return <group ref={ref} position={[world[0], size, world[2]]} onClick={(event) => { event.stopPropagation(); onSelect(); }}><mesh castShadow>{enemy.archetype === 'tank' || enemy.archetype === 'boss' ? <dodecahedronGeometry args={[size, 1]} /> : enemy.archetype === 'mage' || enemy.archetype === 'support' ? <coneGeometry args={[size * 0.8, size * 1.9, 6]} /> : <icosahedronGeometry args={[size, 1]} />}<meshStandardMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={enemy.archetype === 'boss' ? 0.9 : 0.25} roughness={enemy.archetype === 'tank' ? 0.72 : 0.38} metalness={enemy.archetype === 'boss' ? 0.58 : 0.18} /></mesh><mesh position={[0, size * 0.45, size * 0.82]}><sphereGeometry args={[size * 0.15, 8, 8]} /><meshBasicMaterial color={palette.trim} /></mesh>{enemy.archetype === 'ranged' || enemy.archetype === 'mage' ? <mesh position={[0, size * 0.55, 0]}><torusGeometry args={[size * 0.95, 0.025, 6, 16]} /><meshBasicMaterial color={palette.trim} transparent opacity={0.68} /></mesh> : null}{selected && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -size + 0.03, 0]}><ringGeometry args={[size * 1.1, size * 1.24, 24]} /><meshBasicMaterial color="#FBBF24" transparent opacity={0.95} /></mesh>}<pointLight color={enemy.color} intensity={enemy.archetype === 'boss' ? 2.8 : 0.7} distance={enemy.archetype === 'boss' ? 4 : 2} /></group>;
}

function CombatBurst({ pulse, palette }: { pulse: number; palette: typeof FLOOR_PALETTES[number] }) {
  const ref = useRef<THREE.Group>(null);
  const last = useRef(pulse);
  useFrame((_, delta) => { if (!ref.current) return; if (last.current !== pulse) { ref.current.scale.set(0.3, 0.3, 0.3); last.current = pulse; } ref.current.scale.lerp(new THREE.Vector3(1.25, 1.25, 1.25), delta * 8); ref.current.rotation.y += delta * 4; });
  return <group ref={ref} position={[0, 0.08, 0]}><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.7, 0.78, 32]} /><meshBasicMaterial color={palette.trim} transparent opacity={0.75} /></mesh><pointLight color={palette.trim} intensity={2.5} distance={4} /></group>;
}

export function DungeonWorld({ floor, playerConfig, playerPosition, enemies, selectedEnemy, attackPulse, playerHitPulse, onSelectEnemy }: DungeonWorldProps) {
  const palette = FLOOR_PALETTES[Math.min(floor, FLOOR_PALETTES.length - 1)];
  const player = toWorld(playerPosition);
  const boss = enemies.find((enemy) => enemy.archetype === 'boss' && enemy.hp > 0);
  const bossPosition = boss ? toWorld(boss.position) : undefined;
  return <Canvas shadows dpr={[1, 1.5]} camera={{ position: [4.7, 4.2, 5.8], fov: 45 }} gl={{ antialias: true }}><color attach="background" args={[palette.fog]} /><fog attach="fog" args={[palette.fog, 5, 15]} /><PerspectiveCamera makeDefault position={[4.7, 4.2, 5.8]} fov={45} /><ambientLight color="#9CA3AF" intensity={0.62} /><directionalLight position={[3, 7, 4]} intensity={1.7} color="#E0F2FE" castShadow shadow-mapSize={[1024, 1024]} /><pointLight position={[0, 3.2, -4.5]} color={palette.trim} intensity={5} distance={9} /><pointLight position={[0, 1.8, 2.6]} color={palette.danger} intensity={floor >= 2 ? 1.6 : 0.45} distance={6} /><DungeonArchitecture palette={palette} floor={floor} /><CameraFollow player={player} boss={bossPosition} /><PlayerCharacter config={playerConfig} position={player} attackPulse={attackPulse} hitPulse={playerHitPulse} />{enemies.filter((enemy) => enemy.hp > 0).map((enemy) => <EnemyCharacter key={enemy.id} enemy={enemy} selected={selectedEnemy === enemy.id} onSelect={() => onSelectEnemy(enemy.id)} palette={palette} />)}<CombatBurst pulse={attackPulse} palette={palette} /><ContactShadows position={[0, 0.025, 0]} opacity={0.72} scale={12} blur={2.3} far={5} /></Canvas>;
}
