import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/store';
import { ProceduralCharacter } from '../characters/ProceduralCharacter';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function DuelArena() {
  const activeDuel = useGameStore(state => state.activeDuel);
  const players = useGameStore(state => state.players);
  const turnPhase = useGameStore(state => state.turnPhase);
  
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  
  if (turnPhase !== 'dueling' || !activeDuel) return null;
  
  const attacker = players.find(p => p.id === activeDuel.attackerId);
  const defender = players.find(p => p.id === activeDuel.defenderId);
  
  if (!attacker || !defender) return null;

  const handleKnockdown = (loserId: string) => {
    const winnerId = loserId === attacker.id ? defender.id : attacker.id;
    // Dispatch after a short delay for dramatic effect
    setTimeout(() => {
      useGameStore.getState().dispatch({ type: 'RESOLVE_DUEL', winnerId });
    }, 2000);
  };

  return (
    <group position={[0, -100, 0]}>
      {/* Duel Arena Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      
      {/* Lighting for the Arena */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[0, 5, 0]} intensity={2} color="#ffaa00" />
      
      <ProceduralCharacter 
        playerId={attacker.id} 
        inputType={attacker.isAi ? 'ai' : (attacker.id === 'p1' ? 'player1' : 'player2')}
        position={[-2, 0, 0]} 
        onHpChange={setHp1}
        onKnockdown={() => handleKnockdown(attacker.id)}
      />
      
      <ProceduralCharacter 
        playerId={defender.id} 
        inputType={defender.isAi ? 'ai' : (defender.id === 'p1' ? 'player1' : 'player2')}
        position={[2, 0, 0]} 
        onHpChange={setHp2}
        onKnockdown={() => handleKnockdown(defender.id)}
      />

      {/* HP UI Overlay */}
      <Html position={[0, 4, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '600px', padding: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '10px', border: '1px solid #444' }}>
          <div style={{ color: 'white', flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>{attacker.name}</h3>
            <div style={{ width: '100%', background: '#333', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, hp1)}%`, background: '#ff0055', height: '100%', transition: 'width 0.2s' }} />
            </div>
          </div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
            VS
          </div>
          <div style={{ color: 'white', flex: 1, textAlign: 'right' }}>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>{defender.name}</h3>
            <div style={{ width: '100%', background: '#333', height: '20px', borderRadius: '10px', overflow: 'hidden', transform: 'rotate(180deg)' }}>
              <div style={{ width: `${Math.max(0, hp2)}%`, background: '#00aaff', height: '100%', transition: 'width 0.2s' }} />
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
