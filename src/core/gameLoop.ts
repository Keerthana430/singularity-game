import { EventBus } from './eventBus';
import { GameState, GameCommand } from '../state';
import { gameReducer } from '../rules';

export class GameLoop {
  private eventBus: EventBus;
  private state: GameState;

  constructor(eventBus: EventBus, initialState: GameState) {
    this.eventBus = eventBus;
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  dispatch(command: GameCommand): void {
    const { newState, events } = gameReducer(this.state, command);
    this.state = newState;
    
    // Log command for replayability
    this.state.commandLog.push(command);

    for (const event of events) {
      this.eventBus.emit(event);
    }
  }
}
