import { describe, it, expect } from 'vitest';
import { gameReducer, createStandardBoard, validateBoardConfig } from '../src/rules';
import { GameState, GameCommand } from '../src/state';
import { createSeededRng, randomInt } from '../src/rules';
import { serializeState, deserializeState, replayCommands } from '../src/state';

function getInitialState(seed: number = 12345, maxPlayers: number = 2): GameState {
  let state: GameState = {
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
  
  const cmd: GameCommand = {
    type: 'START_GAME',
    playerNames: Array.from({ length: maxPlayers }, (_, i) => `Player ${i+1}`)
  };
  
  const { newState } = gameReducer(state, cmd);
  // Re-seed for testing explicitly
  newState.rngState = seed;
  return newState;
}

describe('Rules Engine Core', () => {
  it('should initialize correctly via START_GAME', () => {
    const state = getInitialState();
    expect(state.players.length).toBe(2);
    expect(state.players[0].position).toBe(1);
    expect(state.players[1].position).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnPhase).toBe('waiting');
  });

  it('should reject invalid ROLL_DICE (wrong player)', () => {
    const state = getInitialState();
    const wrongPlayerCmd: GameCommand = { type: 'ROLL_DICE', playerId: state.players[1].id };
    const { newState, events } = gameReducer(state, wrongPlayerCmd);
    expect(events.length).toBe(0); // Ignored
    expect(newState).toStrictEqual(state);
  });

  it('should reject ROLL_DICE when not waiting (e.g. rolling phase, though technically our pure reducer finishes the roll instantly)', () => {
    const state = getInitialState();
    state.turnPhase = 'rolling'; // Manually force to invalid state
    const cmd: GameCommand = { type: 'ROLL_DICE', playerId: state.players[0].id };
    const { newState, events } = gameReducer(state, cmd);
    expect(events.length).toBe(0); // Ignored
  });

  it('multi-player turn rotation', () => {
    let state = getInitialState(123);
    const p1Id = state.players[0].id;
    const p2Id = state.players[1].id;
    
    expect(state.currentPlayerIndex).toBe(0);
    
    // P1 rolls
    let result = gameReducer(state, { type: 'ROLL_DICE', playerId: p1Id });
    state = result.newState;
    expect(state.currentPlayerIndex).toBe(1); // advanced to p2
    
    // P2 rolls
    result = gameReducer(state, { type: 'ROLL_DICE', playerId: p2Id });
    state = result.newState;
    expect(state.currentPlayerIndex).toBe(0); // back to p1
  });

  describe('Board Interactions (Snakes & Ladders)', () => {
    it('Landed on ladder: should climb', () => {
      let state = getInitialState(12345);
      const p1 = state.players[0];
      
      // We want to force a roll that lands on a ladder.
      // E.g. tile 2 is a ladder to 38. Player is on 1. We need a roll of 1.
      // We can hack the PRNG state or just inject a known value into a temporary function if we could.
      // But we have deterministic RNG. Let's just find a seed that gives 1 on first roll.
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 1) break;
        seed++;
      }
      
      state = getInitialState(seed);
      const { newState, events } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      
      const p1After = newState.players[0];
      expect(p1After.position).toBe(38);
      
      // Check events
      expect(events.some(e => e.type === 'LANDED_ON_LADDER')).toBe(true);
    });

    it('Landed on snake: should slide down', () => {
      let state = getInitialState(12345);
      
      // Force position to just before a snake
      // Snake at 16 goes to 6. Player at 15 needs a 1.
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 1) break;
        seed++;
      }
      
      state = getInitialState(seed);
      state.players[0].position = 15;
      
      const { newState, events } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      
      expect(newState.players[0].position).toBe(6);
      expect(events.some(e => e.type === 'LANDED_ON_SNAKE')).toBe(true);
    });
  });

  describe('Winning and Overshoot', () => {
    it('exactFinish = true (default): Overshoot stays in place', () => {
      let state = getInitialState(999); // just need a seed
      
      // Force roll of 6
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 6) break;
        seed++;
      }
      
      state = getInitialState(seed);
      state.players[0].position = 98; // Needs 2 to win, rolls 6
      
      const { newState, events } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      
      expect(newState.players[0].position).toBe(98); // Didn't move
      expect(events.some(e => e.type === 'OVERSHOOT')).toBe(true);
      expect(newState.winner).toBeNull();
    });

    it('exactFinish = true: Exact roll wins', () => {
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 2) break;
        seed++;
      }
      
      let state = getInitialState(seed);
      state.players[0].position = 98; // Needs 2 to win, rolls 2
      
      const { newState, events } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      
      expect(newState.players[0].position).toBe(100);
      expect(events.some(e => e.type === 'GAME_WON')).toBe(true);
      expect(newState.winner).toBe(state.players[0].id);
      expect(newState.turnPhase).toBe('finished');
    });

    it('exactFinish = false: Overshoot caps at max tile and wins', () => {
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 6) break;
        seed++;
      }
      
      let state = getInitialState(seed);
      state.boardConfig.rules.exactFinish = false;
      state.players[0].position = 98; // Needs 2 to win, rolls 6
      
      const { newState, events } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      
      expect(newState.players[0].position).toBe(100);
      expect(events.some(e => e.type === 'GAME_WON')).toBe(true);
      expect(newState.winner).toBe(state.players[0].id);
    });
  });

  describe('Extra Turn on 6', () => {
    it('extraTurnOnSix = false (default): Turn advances on 6', () => {
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 6) break;
        seed++;
      }
      
      let state = getInitialState(seed);
      expect(state.currentPlayerIndex).toBe(0);
      
      const { newState } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      expect(newState.currentPlayerIndex).toBe(1);
    });

    it('extraTurnOnSix = true: Player rolls again on 6', () => {
      let seed = 0;
      while (true) {
        const rng = createSeededRng(seed);
        if (randomInt(rng, 1, 6) === 6) break;
        seed++;
      }
      
      let state = getInitialState(seed);
      state.boardConfig.rules.extraTurnOnSix = true;
      expect(state.currentPlayerIndex).toBe(0);
      
      const { newState } = gameReducer(state, { type: 'ROLL_DICE', playerId: state.players[0].id });
      expect(newState.currentPlayerIndex).toBe(0); // Stays on player 0
      expect(newState.turnPhase).toBe('waiting'); // Ready to roll again
    });
  });

  describe('Serialization and Determinism', () => {
    it('can serialize and deserialize state identically', () => {
      const state = getInitialState();
      const json = serializeState(state);
      const restored = deserializeState(json);
      expect(restored).toStrictEqual(state);
    });

    it('replaying the same commands yields identical state', () => {
      const seed = 54321;
      const initialState = getInitialState(seed);
      let currentState = initialState;
      const commands: GameCommand[] = [];

      // Play 10 valid moves
      for (let i = 0; i < 10; i++) {
        const pId = currentState.players[currentState.currentPlayerIndex].id;
        const cmd: GameCommand = { type: 'ROLL_DICE', playerId: pId };
        commands.push(cmd);
        const { newState } = gameReducer(currentState, cmd);
        currentState = newState;
      }

      // Replay from initial
      const replayedState = replayCommands(initialState, commands);
      expect(replayedState).toStrictEqual(currentState);
    });
  });

  describe('Board Validation', () => {
    it('validates a standard board successfully', () => {
      const config = createStandardBoard();
      expect(validateBoardConfig(config).valid).toBe(true);
    });

    it('detects invalid snakes (head <= tail)', () => {
      const config = createStandardBoard();
      config.snakes[10] = 20; // Upward snake
      const val = validateBoardConfig(config);
      expect(val.valid).toBe(false);
      expect(val.errors[0]).toMatch(/Snake at 10 must go down/);
    });

    it('detects invalid ladders (bottom >= top)', () => {
      const config = createStandardBoard();
      config.ladders[30] = 20; // Downward ladder
      const val = validateBoardConfig(config);
      expect(val.valid).toBe(false);
      expect(val.errors[0]).toMatch(/Ladder at 30 must go up/);
    });

    it('detects chains', () => {
      const config = createStandardBoard();
      // Snake tail lands on ladder base
      config.snakes[40] = 10;
      config.ladders[10] = 50;
      const val = validateBoardConfig(config);
      expect(val.valid).toBe(false);
      expect(val.errors.some(e => e.includes('Chains are not allowed'))).toBe(true);
    });
  });

  describe('Fuzz Test / Soak Test', () => {
    it('can play thousands of random games without reaching an invalid state', () => {
      const GAMES_TO_PLAY = 1000;
      
      for (let g = 0; g < GAMES_TO_PLAY; g++) {
        let state = getInitialState(g * 1234);
        let turnCount = 0;
        
        while (state.winner === null && turnCount < 1000) {
          turnCount++;
          const pId = state.players[state.currentPlayerIndex].id;
          const { newState } = gameReducer(state, { type: 'ROLL_DICE', playerId: pId });
          state = newState;
          
          // Verify invariants
          expect(state.players[0].position).toBeGreaterThanOrEqual(1);
          expect(state.players[0].position).toBeLessThanOrEqual(100);
          expect(state.players[1].position).toBeGreaterThanOrEqual(1);
          expect(state.players[1].position).toBeLessThanOrEqual(100);
          
          // Should not land ON a snake head or ladder base and stay there
          // (They should have been processed)
          expect(state.boardConfig.snakes[state.players[0].position]).toBeUndefined();
          expect(state.boardConfig.ladders[state.players[0].position]).toBeUndefined();
        }
        
        // Assert game ended correctly or didn't infinite loop
        expect(turnCount).toBeLessThan(1000); 
        expect(state.winner).not.toBeNull();
      }
    });
  });
});
