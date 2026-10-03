import { GameEvent } from '../state';

type EventHandler = (event: GameEvent) => void;

export class EventBus {
  private listeners: EventHandler[] = [];

  subscribe(handler: EventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter(h => h !== handler);
    };
  }

  emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
