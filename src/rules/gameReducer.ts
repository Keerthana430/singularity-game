import { GameState, GameCommand, GameEvent } from '../state';

/**
 * Pure function: takes current state and a command, returns new state and domain events.
 */
export function gameReducer(
  state: GameState,
  command: GameCommand
): { newState: GameState; events: GameEvent[] } {
  // Skeleton implementation for Phase 1
  switch (command.type) {
    case 'ROLL_DICE':
      return { newState: state, events: [] };
    case 'START_GAME':
      return { newState: state, events: [] };
    case 'RESTART_GAME':
      return { newState: state, events: [] };
    case 'SKIP_ANIMATION':
      return { newState: state, events: [] };
    default:
      return { newState: state, events: [] };
  }
}
