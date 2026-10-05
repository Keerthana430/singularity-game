import React, { useEffect } from 'react';
import { useGameStore } from '../state/store';

export function PrototypeUI() {
  const dispatch = useGameStore(state => state.dispatch);
  const players = useGameStore(state => state.players);
  const currentPlayerIndex = useGameStore(state => state.currentPlayerIndex);
  const turnPhase = useGameStore(state => state.turnPhase);
  const winner = useGameStore(state => state.winner);
  
  useEffect(() => {
    // Start game on mount if no players
    if (players.length === 0) {
      dispatch({ type: 'START_GAME', playerNames: ['P1 (Red)', 'P2 (Green)'] });
    }
  }, [players.length, dispatch]);

  if (players.length === 0) return null;

  const activePlayer = players[currentPlayerIndex];

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.8)', padding: 20, color: '#fff', borderRadius: 8, zIndex: 10 }}>
      <h3>Snakes & Ladders (Phase 3)</h3>
      
      {winner ? (
        <div style={{ color: '#00ff88', fontWeight: 'bold' }}>
          {players.find(p => p.id === winner)?.name} Wins!
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            Current Turn: <span style={{ color: activePlayer.color, fontWeight: 'bold' }}>{activePlayer.name}</span>
          </div>
          <div>
            Status: {turnPhase}
          </div>
          <button 
            disabled={turnPhase !== 'waiting'}
            onClick={() => dispatch({ type: 'ROLL_DICE', playerId: activePlayer.id })}
            style={{
              marginTop: 15,
              padding: '10px 20px',
              background: turnPhase === 'waiting' ? activePlayer.color : '#555',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: turnPhase === 'waiting' ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            ROLL DICE
          </button>
        </>
      )}

      <div style={{ marginTop: 20, fontSize: '0.8em', color: '#aaa' }}>
        <strong>Positions:</strong>
        {players.map(p => (
          <div key={p.id}>
            <span style={{ color: p.color }}>{p.name}</span>: Tile {p.position}
          </div>
        ))}
      </div>
    </div>
  );
}
