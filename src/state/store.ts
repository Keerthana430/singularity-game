import { create } from 'zustand';
import { GameState } from './gameState';
import { GameCommand } from './commandTypes';
import { gameReducer } from '../rules/gameReducer';
import { createStandardBoard } from '../rules/boardDefinition';
import { eventBus } from '../core/eventBus';

function validateGameState(state: GameState): boolean {
  if (state.players.length > 0) {
    if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) return false;
  }
  for (const player of state.players) {
    if (player.position < 1 || player.position > state.boardConfig.size || isNaN(player.position)) return false;
  }
  return true;
}

let watchdogTimer: any = null;

interface GameStore extends GameState {
  dispatch: (command: GameCommand) => void;
}

const initialState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  turnPhase: 'waiting',
  boardConfig: createStandardBoard(),
  turnNumber: 1,
  winner: null,
  rngState: Date.now(),
  lastDiceResult: null,
  commandLog: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  dispatch: (command: GameCommand) => {
    set((state) => {
      const { newState, events } = gameReducer(state, command);
      
      if (!validateGameState(newState)) {
        console.error('Invalid state detected after command', command, '. Rolling back.');
        return state;
      }
      
      // Emit events to the event bus
      events.forEach(e => eventBus.emit(e.type, e));
      
      // Watchdog
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      
      if (newState.turnPhase !== 'waiting' && newState.turnPhase !== 'finished') {
        watchdogTimer = setTimeout(() => {
          console.warn(`Watchdog triggered! Game stuck in ${newState.turnPhase} for 15s. Auto-recovering...`);
          // We can't use `set` inside a loose setTimeout easily without `get()`, so we just dispatch a recovery command or reset the phase
          useGameStore.setState(s => ({
            ...s,
            turnPhase: 'waiting',
            activeMovement: undefined // If we had active movement in state, we'd clear it here, though it's technically in AppShell state right now
          }));
        }, 15000);
      }
      
      return newState;
    });
  }
}));
