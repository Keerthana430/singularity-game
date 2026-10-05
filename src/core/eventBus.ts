import { GameEvent } from '../state';

type EventHandler<T extends GameEvent['type']> = (event: Extract<GameEvent, { type: T }>) => void;

export class EventBus {
  private listeners: Map<string, Array<(event: any) => void>> = new Map();

  on<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler as (event: any) => void);
  }

  off<T extends GameEvent['type']>(type: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(type)) return;
    const handlers = this.listeners.get(type)!;
    this.listeners.set(type, handlers.filter(h => h !== (handler as (event: any) => void)));
  }

  emit(type: GameEvent['type'], event: GameEvent): void {
    if (!this.listeners.has(type)) return;
    for (const listener of this.listeners.get(type)!) {
      listener(event);
    }
  }
}

export const eventBus = new EventBus();
