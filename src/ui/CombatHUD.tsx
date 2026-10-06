import React from 'react';
import { useCombatStore } from '../state/combatStore';

export function CombatHUD() {
  const entities = useCombatStore(state => state.entities);
  
  const player = entities['player1'];
  const opponent = entities['opponent1'];

  // Calculate percentages
  const p1HpPercent = player ? Math.max(0, (player.hp / player.maxHp) * 100) : 100;
  const p1StaminaPercent = player ? Math.max(0, (player.stamina / player.maxStamina) * 100) : 100;
  
  const p2HpPercent = opponent ? Math.max(0, (opponent.hp / opponent.maxHp) * 100) : 100;
  const p2StaminaPercent = opponent ? Math.max(0, (opponent.stamina / opponent.maxStamina) * 100) : 100;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      pointerEvents: 'none',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      
      {/* Player 1 HUD */}
      <div style={{ width: '40%' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '24px', marginBottom: '8px', textShadow: '2px 2px 0 #000' }}>
          PLAYER 1
        </div>
        <div style={{ width: '100%', height: '30px', backgroundColor: '#333', border: '2px solid white', transform: 'skewX(-15deg)', marginBottom: '8px' }}>
          <div style={{ 
            width: `${p1HpPercent}%`, 
            height: '100%', 
            backgroundColor: '#00ff00',
            transition: 'width 0.2s ease-out'
          }} />
        </div>
        <div style={{ width: '80%', height: '10px', backgroundColor: '#333', border: '1px solid white', transform: 'skewX(-15deg)' }}>
          <div style={{ 
            width: `${p1StaminaPercent}%`, 
            height: '100%', 
            backgroundColor: '#ffff00',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      {/* Timer / Middle */}
      <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
        VS
      </div>

      {/* Opponent HUD */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '24px', marginBottom: '8px', textShadow: '2px 2px 0 #000' }}>
          OPPONENT
        </div>
        <div style={{ width: '100%', height: '30px', backgroundColor: '#333', border: '2px solid white', transform: 'skewX(-15deg)', marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ 
            width: `${p2HpPercent}%`, 
            height: '100%', 
            backgroundColor: '#ff0000',
            transition: 'width 0.2s ease-out'
          }} />
        </div>
        <div style={{ width: '80%', height: '10px', backgroundColor: '#333', border: '1px solid white', transform: 'skewX(-15deg)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ 
            width: `${p2StaminaPercent}%`, 
            height: '100%', 
            backgroundColor: '#ffff00',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>
      
    </div>
  );
}
