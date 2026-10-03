import { create } from 'zustand';
import { GameState } from './gameState';
import { GameCommand } from './commandTypes';
import { gameReducer } from '../rules/gameReducer';
import { createStandardBoard } from '../rules/boardDefinition';
import { eventBus } from '../core/eventBus';

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
      
      // Emit events to the event bus
      events.forEach(e => eventBus.emit(e.type, e));
      
      return newState;
    });
  }
}));
