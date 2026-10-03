import { describe, it, expect } from 'vitest';
import { gameReducer, createStandardBoard } from '../src/rules';
import { GameState, GameCommand } from '../src/state';

function getInitialState(seed: number = 1, maxPlayers: number = 2): GameState {
  const state: GameState = {
    players: [],
    currentPlayerIndex: 0,
    turnPhase: 'waiting',
    boardConfig: createStandardBoard(),
    turnNumber: 1,
    winner: null,
    rngState: seed,
    lastDiceResult: null,
    commandLog: [],
  };
  const { newState } = gameReducer(state, { 
    type: 'START_GAME', 
    playerNames: Array.from({ length: maxPlayers }, (_, i) => `P${i+1}`) 
  });
  newState.rngState = seed;
  return newState;
}

describe('Rules Engine - Soak Test', () => {
  it('should complete 1000 random games without getting stuck or entering invalid states', () => {
    const NUM_GAMES = 1000;
    
    for (let i = 0; i < NUM_GAMES; i++) {
      let state = getInitialState(i * 9999);
      let turns = 0;
      const MAX_TURNS = 2000; // Hard limit to prevent infinite loops

      while (state.winner === null && turns < MAX_TURNS) {
        // Roll dice
        const currentPlayerId = state.players[state.currentPlayerIndex].id;
        let result = gameReducer(state, { type: 'ROLL_DICE', playerId: currentPlayerId });
        state = result.newState;
        
        // Assert state is valid
        for (const p of state.players) {
          expect(p.position).toBeGreaterThanOrEqual(1);
          expect(p.position).toBeLessThanOrEqual(state.boardConfig.size);
          expect(isNaN(p.position)).toBe(false);
        }

        turns++;
      }

      // Ensure the game actually finished and didn't hit the turn limit
      expect(state.winner).not.toBeNull();
      expect(turns).toBeLessThan(MAX_TURNS);
      expect(state.turnPhase).toBe('finished');
    }
  });
});
