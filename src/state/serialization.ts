import { GameState } from './gameState';
import { GameCommand } from './commandTypes';
import { gameReducer } from '../rules/gameReducer';

/**
 * Serializes the full game state into a JSON string.
 */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Deserializes the game state from a JSON string.
 */
export function deserializeState(json: string): GameState {
  return JSON.parse(json);
}

/**
 * Replays a command log from a given initial state (or default start)
 * to reproduce the exact final state.
 */
export function replayCommands(initialState: GameState, commands: GameCommand[]): GameState {
  let currentState = initialState;
  
  for (const command of commands) {
    const { newState } = gameReducer(currentState, command);
    currentState = newState;
  }
  
  return currentState;
}
